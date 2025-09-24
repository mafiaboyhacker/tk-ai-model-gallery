/**
 * Railway Volume + PostgreSQL 통합 미디어 스토어
 * /app/uploads 디렉토리에 파일 저장 + PostgreSQL에 메타데이터 저장
 */

import { create } from 'zustand'
import type {
  MediaStore,
  GalleryMediaData,
  RatioConfig,
  UploadStatus,
  UploadProgressHandler,
  UploadStatusState
} from '@/types'

interface RailwayMediaStore extends MediaStore {
  isLoading: boolean
  error: string | null
  isClearingQueue: boolean
}

export const useRailwayMediaStore = create<RailwayMediaStore>((set, get) => ({
  // 상태
  media: [],
  isLoading: false,
  error: null,
  selectedMedia: null,
  uploadQueue: [],
  overallProgress: 0,
  isClearingQueue: false,

  // 기본 비율 설정
  ratioConfig: {
    videoRatio: 0.50,
    topVideoCount: 15,
    shuffleMode: 'ratio-based' as const
  },

  // 미디어 로드
  loadMedia: async () => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Railway: 미디어 목록 로드 시작')
      }

      const response = await fetch('/api/railway/storage?action=list')
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Railway: API 응답 상태:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Railway: API 응답 데이터:', data)
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to load media')
      }

      // 🚀 API 데이터를 Gallery 형식으로 변환 (title → customName 매핑)
      const convertedMedia = data.data.map((item: any) => ({
        ...item,
        customName: item.title // title을 customName으로 매핑 (MODEL #1, VIDEO #1 형식)
      }))

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Railway: ${convertedMedia.length}개 미디어 로드 성공`)
        console.log('🔍 Railway: 첫 번째 미디어 샘플:', convertedMedia[0])
      }
      set({ media: convertedMedia, isLoading: false })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway: 미디어 로드 실패:', error)
      }
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  },

  // 🚀 실제 업로드 진행률이 포함된 XMLHttpRequest 기반 업로드
  uploadFileWithProgress: async (file: File, onFileProgress?: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      // 업로드 진행률 추적
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onFileProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onFileProgress(progress)
        }
      })

      // 완료 처리
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              resolve(data.data)
            } else {
              reject(new Error(data.error || 'Upload failed'))
            }
          } catch (e) {
            reject(new Error('Invalid response format'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      })

      // 에러 처리
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })

      // 업로드 설정 및 시작
      xhr.timeout = 300000 // 5분 타임아웃
      xhr.open('POST', '/api/railway/storage?action=upload')
      xhr.send(formData)
    })
  },

  // 🚀 병렬 업로드 지원 미디어 추가 (진행률 콜백 지원)
  addMedia: async (files: File[], options?: { onProgress?: UploadProgressHandler }) => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Railway: ${files.length}개 파일 병렬 업로드 시작`)
      }

      const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB 제한
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)

      if (oversizedFiles.length > 0) {
        const oversizedNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ')
        throw new Error(`파일 크기가 500MB를 초과합니다: ${oversizedNames}`)
      }

      const total = files.length
      if (total === 0) {
        set({ isLoading: false, uploadQueue: [], overallProgress: 0 })
        return
      }

      const queueBase = Date.now()
      const queueEntries: UploadStatus[] = files.map((file, index) => ({
        id: `${queueBase}-${index}`,
        fileName: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        progress: 0,
        status: 'pending',
        startedAt: Date.now()
      }))

      set({ uploadQueue: queueEntries, overallProgress: 0 })

      const updateQueue = (id: string, updates: Partial<UploadStatus>) => {
        let snapshot = { overallProgress: 0, processed: 0 }
        set((state) => {
          const uploadQueue = state.uploadQueue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          )
          const overall = uploadQueue.length
            ? Math.round(uploadQueue.reduce((sum, item) => sum + item.progress, 0) / uploadQueue.length)
            : 0
          const processed = uploadQueue.filter(item => item.status === 'completed').length
          snapshot = { overallProgress: overall, processed }
          return { uploadQueue, overallProgress: overall }
        })
        return snapshot
      }

      const emitProgress = (
        fileName: string,
        fileProgress: number,
        status: UploadStatusState,
        snapshot: { overallProgress: number; processed: number },
        error?: string
      ) => {
        options?.onProgress?.({
          overallProgress: snapshot.overallProgress,
          fileName,
          processed: snapshot.processed,
          total,
          fileProgress,
          status,
          error
        })
      }

      const uploadResults: GalleryMediaData[] = []
      const currentMedia = get().media
      const MAX_CONCURRENT = 3

      const chunks: File[][] = []
      for (let i = 0; i < files.length; i += MAX_CONCURRENT) {
        chunks.push(files.slice(i, i + MAX_CONCURRENT))
      }

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]
        const baseIndex = chunkIndex * MAX_CONCURRENT

        const chunkPromises = chunk.map(async (file, index) => {
          const globalIndex = baseIndex + index
          const queueEntry = queueEntries[globalIndex]

          const startSnapshot = updateQueue(queueEntry.id, {
            status: 'uploading',
            progress: 0,
            startedAt: Date.now()
          })
          emitProgress(file.name, 0, 'uploading', startSnapshot)

          return get().uploadFileWithProgress(file, (fileProgress) => {
            const progressSnapshot = updateQueue(queueEntry.id, {
              status: 'uploading',
              progress: fileProgress
            })
            emitProgress(file.name, fileProgress, 'uploading', progressSnapshot)
          }).then((result) => ({ status: 'fulfilled' as const, value: result, queueEntry, file }))
            .catch((error) => ({ status: 'rejected' as const, reason: error, queueEntry, file }))
        })

        const chunkResults = await Promise.all(chunkPromises)

        chunkResults.forEach((result) => {
          const { queueEntry, file } = result

          if (result.status === 'fulfilled') {
            const converted = {
              ...result.value,
              customName: result.value.title
            }
            uploadResults.push(converted)
            const snapshot = updateQueue(queueEntry.id, {
              status: 'completed',
              progress: 100,
              completedAt: Date.now()
            })
            emitProgress(file.name, 100, 'completed', snapshot)
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Railway: ${file.name} 업로드 성공 - ${converted.customName}`)
            }
          } else {
            const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
            const snapshot = updateQueue(queueEntry.id, {
              status: 'failed',
              progress: 100,
              completedAt: Date.now(),
              error: message
            })
            emitProgress(file.name, 100, 'failed', snapshot, message)
            if (process.env.NODE_ENV === 'development') {
              console.error(`❌ Railway: ${file.name} 업로드 실패:`, result.reason)
            }
          }
        })
      }

      set({
        media: [...uploadResults, ...currentMedia],
        isLoading: false
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Railway: 총 ${uploadResults.length}/${files.length}개 파일 업로드 완료`)
      }

      if (uploadResults.length < files.length) {
        const failedCount = files.length - uploadResults.length
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Railway: ${failedCount}개 파일 업로드 실패`)
        }
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Railway: 파일 업로드 실패:`, error)
      }
      set({
        error: error instanceof Error ? error.message : 'Upload failed',
        isLoading: false
      })
      throw error
    }
  },

  // 미디어 삭제
  deleteMedia: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Railway: ${id} 삭제 시작`)
      }

      const response = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Delete failed')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Railway: ${id} 삭제 성공`)
      }

      // 상태 업데이트
      const currentMedia = get().media
      set({
        media: currentMedia.filter(item => item.id !== id),
        isLoading: false
      })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Railway: ${id} 삭제 실패:`, error)
      }
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isLoading: false
      })
      throw error
    }
  },

  // 커스텀 이름 업데이트
  updateCustomName: async (id: string, newName: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Railway: ${id} 이름 변경: ${newName}`)
      }

      // PostgreSQL에서 title 업데이트 API 호출
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newName })
      })

      if (!response.ok) {
        throw new Error('Failed to update name')
      }

      // 로컬 상태 업데이트
      const currentMedia = get().media
      const updatedMedia = currentMedia.map(item =>
        item.id === id ? { ...item, fileName: newName } : item
      )
      set({ media: updatedMedia })

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Railway: ${id} 이름 변경 성공`)
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Railway: ${id} 이름 변경 실패:`, error)
      }
      throw error
    }
  },

  // 스토리지 통계
  getStorageStats: async () => {
    const currentMedia = get().media
    const images = currentMedia.filter(m => m.type === 'image')
    const videos = currentMedia.filter(m => m.type === 'video')

    const totalSize = currentMedia.reduce((sum, item) => sum + (item.fileSize || 0), 0)
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)

    return {
      count: currentMedia.length,
      estimatedSize: `${sizeInMB} MB`,
      images: images.length,
      videos: videos.length
    }
  },

  // 비율 기반 배치 (랜덤 섞기) - URL 무결성 보장
  arrangeByRatio: () => {
    const { media, ratioConfig } = get()
    if (!media.length || !ratioConfig) return

    const images = media.filter(m => m.type === 'image')
    const videos = media.filter(m => m.type === 'video')

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Railway: 미디어 분석: 총 ${media.length}개 (비디오 ${videos.length}개, 이미지 ${images.length}개)`)
    }

    // 🚀 URL 무결성 검증 및 복구
    const validateUrls = (mediaArray: typeof media) => {
      return mediaArray.map(item => {
        // URL이 손상되었거나 누락된 경우 복구
        if (!item.url || !item.url.includes('/api/railway/storage/file/')) {
          const fixedUrl = `/api/railway/storage/file/${item.type}/${item.fileName}`
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔧 Railway: URL 복구 - ${item.fileName}: ${item.url} → ${fixedUrl}`)
          }
          return { ...item, url: fixedUrl }
        }
        return item
      })
    }

    // URL 검증 후 랜덤 배치
    const validatedVideos = validateUrls(videos)
    const validatedImages = validateUrls(images)

    const shuffledVideos = [...validatedVideos].sort(() => Math.random() - 0.5)
    const shuffledImages = [...validatedImages].sort(() => Math.random() - 0.5)

    // 모든 비디오와 이미지를 사용 (제한 없음)
    const allMedia = [...shuffledVideos, ...shuffledImages]
    const arrangedMedia = allMedia.sort(() => Math.random() - 0.5)

    // 🚀 상태 업데이트 추가
    set({ media: arrangedMedia })
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Railway: 비율 기반 배치 완료 - 비디오 ${validatedVideos.length}개, 이미지 ${validatedImages.length}개`)
    }
  },

  // 모드별 셔플 - URL 무결성 보장
  shuffleByMode: (mode?: 'random' | 'ratio-based' | 'video-first' | 'image-first') => {
    const { media, arrangeByRatio, ratioConfig } = get()
    const shuffleMode = mode || ratioConfig?.shuffleMode || 'random'

    // 🚀 URL 무결성 검증 함수 (공통 사용)
    const validateUrls = (mediaArray: typeof media) => {
      return mediaArray.map(item => {
        if (!item.url || !item.url.includes('/api/railway/storage/file/')) {
          const fixedUrl = `/api/railway/storage/file/${item.type}/${item.fileName}`
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔧 Railway: URL 복구 - ${item.fileName}: ${item.url} → ${fixedUrl}`)
          }
          return { ...item, url: fixedUrl }
        }
        return item
      })
    }

    let arrangedMedia: typeof media

    switch (shuffleMode) {
      case 'ratio-based':
        if (arrangeByRatio) {
          arrangeByRatio() // arrangeByRatio는 내부에서 set() 호출하고 URL 검증 포함
          return
        } else {
          arrangedMedia = validateUrls([...media].sort(() => Math.random() - 0.5))
        }
        break
      case 'video-first':
        const videos = validateUrls(media.filter(m => m.type === 'video'))
        const images = validateUrls(media.filter(m => m.type === 'image'))
        arrangedMedia = [...videos, ...images]
        break
      case 'image-first':
        const imgs = validateUrls(media.filter(m => m.type === 'image'))
        const vids = validateUrls(media.filter(m => m.type === 'video'))
        arrangedMedia = [...imgs, ...vids]
        break
      case 'random':
      default:
        arrangedMedia = validateUrls([...media].sort(() => Math.random() - 0.5))
        break
    }

    // 🚀 상태 업데이트 추가
    set({ media: arrangedMedia })
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎲 Railway: ${shuffleMode} 모드 배치 완료 - ${arrangedMedia.length}개 미디어 (URL 검증 완료)`)
    }
  },

  // 비율 설정 업데이트
  updateRatioConfig: (config: Partial<RatioConfig>) => {
    set(state => ({
      ratioConfig: {
        videoRatio: 0.15,
        topVideoCount: 3,
        shuffleMode: 'ratio-based' as const,
        ...state.ratioConfig,
        ...config
      }
    }))
  },

  // 전체 삭제
  clearAllMedia: async () => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Railway: 전체 미디어 삭제 시작')
      }

      const response = await fetch('/api/railway/storage?action=clear-all', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Bulk clear failed')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Railway: 전체 미디어 삭제 완료:', data.message)
        console.log('📊 삭제 통계:', {
          files: data.deletedFiles,
          records: data.deletedRecords,
          errors: data.errors
        })
      }

      // 상태 초기화
      set({
        media: [],
        isLoading: false
      })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway: 전체 미디어 삭제 실패:', error)
      }
      set({
        error: error instanceof Error ? error.message : 'Clear all failed',
        isLoading: false
      })
      throw error
    }
  },

  // MediaStore 인터페이스 호환성을 위한 추가 메서드들
  removeMedia: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Railway: ${id} 삭제 시작`)
      }

      const response = await fetch(`/api/railway/storage?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Delete failed')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Railway: ${id} 삭제 성공`)
      }

      // 상태 업데이트
      const currentMedia = get().media
      set({
        media: currentMedia.filter(item => item.id !== id),
        isLoading: false
      })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Railway: ${id} 삭제 실패:`, error)
      }
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isLoading: false
      })
      throw error
    }
  },
  updateMedia: async (id: string, updates: Partial<GalleryMediaData>) => {
    // TODO: Railway API에 updateMedia 엔드포인트 추가 필요
    if (process.env.NODE_ENV === 'development') {
      console.log('updateMedia는 아직 구현되지 않음')
    }
  },
  clearMedia: async () => {
    // Delegate to clearAllMedia for consistency
    return get().clearAllMedia()
  },

  // 비디오만 삭제
  clearVideos: async () => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Railway: 비디오 삭제 시작')
      }

      const response = await fetch('/api/railway/storage?action=clear-videos', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Video clear failed')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Railway: 비디오 삭제 완료:', data.message)
      }

      // 비디오만 제거하고 이미지는 유지
      const currentMedia = get().media
      const remainingMedia = currentMedia.filter(item => item.type !== 'video')

      set({
        media: remainingMedia,
        isLoading: false
      })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway: 비디오 삭제 실패:', error)
      }
      set({
        error: error instanceof Error ? error.message : 'Clear videos failed',
        isLoading: false
      })
      throw error
    }
  },

  // 이미지만 삭제
  clearImages: async () => {
    set({ isLoading: true, error: null })

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Railway: 이미지 삭제 시작')
      }

      const response = await fetch('/api/railway/storage?action=clear-images', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Image clear failed')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Railway: 이미지 삭제 완료:', data.message)
      }

      // 이미지만 제거하고 비디오는 유지
      const currentMedia = get().media
      const remainingMedia = currentMedia.filter(item => item.type !== 'image')

      set({
        media: remainingMedia,
        isLoading: false
      })

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway: 이미지 삭제 실패:', error)
      }
      set({
        error: error instanceof Error ? error.message : 'Clear images failed',
        isLoading: false
      })
      throw error
    }
  },

  clearUploadQueue: async () => {
    set({ isClearingQueue: true })

    // 시각적 피드백을 위한 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 300))

    console.log('🗑️ 전체 업로드 큐 클리어')
    set({
      uploadQueue: [],
      overallProgress: 0,
      isClearingQueue: false
    })
  },

  // 타입별 업로드 큐 클리어 (이미지 또는 비디오만)
  clearUploadQueueByType: async (type: 'image' | 'video') => {
    set({ isClearingQueue: true })

    const currentQueue = get().uploadQueue
    const filteredQueue = currentQueue.filter(item => {
      // 지정된 타입이 아닌 항목만 남김
      if (item.file) {
        return !item.file.type.startsWith(type)
      }
      return true
    })

    console.log(`🗑️ ${type} 업로드 큐 클리어: ${currentQueue.length} → ${filteredQueue.length}`)

    // 시각적 피드백을 위한 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 300))

    // 남은 항목이 있으면 진행률 재계산, 없으면 0으로 설정
    const newProgress = filteredQueue.length === 0 ? 0 : get().overallProgress
    set({
      uploadQueue: filteredQueue,
      overallProgress: newProgress,
      isClearingQueue: false
    })
  },
  searchMedia: (query: string) => {
    const currentMedia = get().media
    return currentMedia.filter(item =>
      item.fileName?.toLowerCase().includes(query.toLowerCase())
    )
  },
  filterByType: (type: 'image' | 'video' | 'all') => {
    const currentMedia = get().media
    if (type === 'all') return currentMedia
    return currentMedia.filter(item => item.type === type)
  },
  filterByCategory: (category: string) => {
    // Railway에서는 카테고리가 별도로 관리되지 않으므로 전체 반환
    return get().media
  },
  sortMedia: (by: any, order: any) => {
    // TODO: 정렬 기능 구현 필요
    if (process.env.NODE_ENV === 'development') {
      console.log('sortMedia는 아직 구현되지 않음')
    }
  },
  shuffleMedia: () => {
    const currentMedia = get().media
    const shuffled = [...currentMedia].sort(() => Math.random() - 0.5)
    set({ media: shuffled })
  },
  getRandomMedia: (count: number) => {
    const currentMedia = get().media
    return currentMedia.sort(() => Math.random() - 0.5).slice(0, count)
  },
  getFeaturedMedia: () => {
    // Railway에서는 featured 개념이 없으므로 최신 미디어 반환
    return get().media.slice(0, 10)
  },
  getStats: () => {
    const currentMedia = get().media
    const images = currentMedia.filter(m => m.type === 'image')
    const videos = currentMedia.filter(m => m.type === 'video')
    const totalSize = currentMedia.reduce((sum, item) => sum + (item.fileSize || 0), 0)

    return {
      total: currentMedia.length,
      images: images.length,
      videos: videos.length,
      totalSize,
      averageSize: currentMedia.length > 0 ? totalSize / currentMedia.length : 0,
      categories: {
        'image': images.length,
        'video': videos.length
      }
    }
  },

  // Railway 환경 전용 저장소 통계 (PostgreSQL 기반)
  getStorageStats: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Railway: PostgreSQL 기반 저장소 통계 계산 시작')
      }

      const currentMedia = get().media
      const images = currentMedia.filter(m => m.type === 'image')
      const videos = currentMedia.filter(m => m.type === 'video')

      // 총 파일 크기 계산 (바이트 단위)
      const totalSizeBytes = currentMedia.reduce((sum, item) => sum + (item.fileSize || 0), 0)

      // 사이즈를 읽기 쉬운 형태로 변환
      const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      const result = {
        count: currentMedia.length,
        estimatedSize: formatSize(totalSizeBytes),
        images: images.length,
        videos: videos.length
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Railway: PostgreSQL 통계 계산 완료:', {
          ...result,
          totalSizeBytes,
          dataSource: 'Railway PostgreSQL (실제 데이터)',
          timestamp: new Date().toISOString()
        })
      }

      return result

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway: 저장소 통계 계산 실패:', error)
      }
      return {
        count: 0,
        estimatedSize: '0 Bytes',
        images: 0,
        videos: 0
      }
    }
  }
}))
