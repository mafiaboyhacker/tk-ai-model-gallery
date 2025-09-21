import { create } from 'zustand'
import { mediaDB } from '@/lib/mediaDB'
import { shuffleArray, getRandomElements, arrangeMediaByRatio, type MediaRatioConfig } from '@/utils/arrayUtils'
import type { UploadStatus, UploadProgressHandler, UploadStatusState } from '@/types'

// 갤러리 표시용 인터페이스 (미디어 통합)
interface GalleryMediaData {
  id: string
  type: 'image' | 'video'      // 미디어 타입
  url: string                  // 썸네일 URL (갤러리용)
  originalUrl: string          // 원본 URL (모달용)
  width: number               // 썸네일 크기
  height: number
  fileName: string
  customName?: string          // 사용자 지정 이름 (Model #1, Video #1 등)
  uploadedAt: number
  duration?: number           // 비디오 재생 시간
  resolution?: string         // 비디오 해상도
}

interface UploadStatus {
  id: string
  fileName: string
  type: 'image' | 'video'
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  startedAt: number
  completedAt?: number
  error?: string
}

interface MediaStore {
  media: GalleryMediaData[]   // 갤러리용 미디어 데이터
  isLoading: boolean
  isInitialized: boolean
  error: string | null        // 에러 상태
  selectedMedia: GalleryMediaData | null  // 선택된 미디어
  uploadQueue: UploadStatus[]
  overallProgress: number
  uploadQueue: UploadStatus[]
  overallProgress: number

  // 기본 작업
  addMedia: (files: File[], options?: { onProgress?: (event: {
    overallProgress: number
    fileName: string
    processed: number
    total: number
    fileProgress: number
    status: UploadStatus['status']
    error?: string
  }) => void }) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  updateMedia: (id: string, updates: Partial<GalleryMediaData>) => Promise<void>
  clearMedia: () => Promise<void>
  loadMedia: () => Promise<void>
  updateCustomName: (id: string, customName: string) => Promise<void>
  getStorageStats: () => Promise<{ count: number; estimatedSize: string; images: number; videos: number }>
  clearUploadQueue: () => void

  // 검색 및 필터링
  searchMedia: (query: string) => GalleryMediaData[]
  filterByType: (type: 'image' | 'video' | 'all') => GalleryMediaData[]
  filterByCategory: (category: string) => GalleryMediaData[]
  sortMedia: (by: 'createdAt' | 'fileName' | 'type' | 'size', order: 'asc' | 'desc') => void

  // 🎲 랜덤 배치 기능
  shuffleMedia: () => void
  getRandomMedia: (count?: number) => GalleryMediaData[]
  getFeaturedMedia: () => GalleryMediaData[]

  // 📊 비율 기반 배치 기능
  ratioConfig: MediaRatioConfig
  updateRatioConfig: (config: Partial<MediaRatioConfig>) => void
  arrangeByRatio: () => void
  shuffleByMode: () => void

  // 통계
  getStats: () => { total: number; images: number; videos: number; totalSize: number; averageSize: number; categories: Record<string, number> }

  // 하위 호환성을 위한 메서드들
  get images(): GalleryMediaData[]
  addImages: (files: File[], options?: { onProgress?: UploadProgressHandler }) => Promise<void>
  removeImage: (id: string) => Promise<void>
  clearImages: () => Promise<void>
  loadImages: () => Promise<void>
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedMedia: null,
  uploadQueue: [],
  overallProgress: 0,
  uploadQueue: [],
  overallProgress: 0,

  // 📊 비율 기반 배치 설정 (기본값: 비디오 15%, 상단 반응형)
  ratioConfig: {
    videoRatio: 0.50,
    topVideoCount: 15, // 기본값 (모바일)
    topVideoCountDesktop: 20, // 데스크탑용
    shuffleMode: 'ratio-based'
  },

  // MediaDB에서 미디어 로드 (갤러리용으로 변환)
  loadMedia: async () => {
    try {
      set({ isLoading: true })

      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      const rawMedia = await mediaDB.getAllMedia()

      // 갤러리용 데이터로 변환
      const galleryMedia: GalleryMediaData[] = rawMedia.map((media) => ({
        id: media.id,
        type: media.type,
        url: media.thumbnailUrl,           // 갤러리에는 썸네일 표시
        originalUrl: media.originalUrl,    // 모달에는 원본 표시
        width: media.thumbnailWidth,
        height: media.thumbnailHeight,
        fileName: media.fileName,
        customName: media.customName,      // 사용자 지정 이름
        uploadedAt: media.uploadedAt,
        duration: media.duration,          // 비디오 재생 시간
        resolution: media.resolution       // 비디오 해상도
      }))

      set({ media: galleryMedia, isLoading: false })

      const images = galleryMedia.filter(m => m.type === 'image').length
      const videos = galleryMedia.filter(m => m.type === 'video').length
      console.log(`✅ MediaDB에서 미디어 로드 완료: ${galleryMedia.length}개 (이미지: ${images}, 비디오: ${videos})`)
    } catch (error) {
      console.error('❌ 미디어 로드 실패:', error)
      set({ isLoading: false })
    }
  },

  // 여러 미디어 추가 (File[] 배열 처리)
  addMedia: async (files: File[], options?: { onProgress?: (event: {
    overallProgress: number
    fileName: string
    processed: number
    total: number
    fileProgress: number
    status: UploadStatus['status']
    error?: string
  }) => void }) => {
    console.log('🔄 IndexedDB 미디어 추가 시작:', files.length, '개 파일')
    try {
      set({ isLoading: true })
      set({ uploadQueue: [], overallProgress: 0 })

      console.log('📊 IndexedDB 초기화 확인...', { initialized: get().isInitialized })
      if (!get().isInitialized) {
        console.log('🔧 MediaDB 초기화 중...')
        await mediaDB.init()
        set({ isInitialized: true })
        console.log('✅ MediaDB 초기화 완료')
      }

      console.log('💾 MediaDB에 파일 저장 시작...')

      const total = files.length
      if (total === 0) {
        set({ isLoading: false })
        return
      }

      const queueBase = Date.now()
      const initialQueue: UploadStatus[] = files.map((file, index) => ({
        id: `${queueBase}-${index}`,
        fileName: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        progress: 0,
        status: 'pending',
        startedAt: Date.now()
      }))

      set({ uploadQueue: initialQueue, overallProgress: 0 })

      const updateQueue = (id: string, updates: Partial<UploadStatus>) => {
        set((state) => {
          const uploadQueue = state.uploadQueue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          )
          const overall = uploadQueue.length
            ? Math.round(uploadQueue.reduce((sum, item) => sum + item.progress, 0) / uploadQueue.length)
            : 0
          return { uploadQueue, overallProgress: overall }
        })
      }

      const emitProgress = (params: { fileName: string; processed: number; fileProgress: number; status: UploadStatusState; error?: string }) => {
        const state = get()
        options?.onProgress?.({
          overallProgress: state.overallProgress,
          fileName: params.fileName,
          processed: params.processed,
          total,
          fileProgress: params.fileProgress,
          status: params.status,
          error: params.error
        })
      }

      const processedMedia = []
      let completedCount = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const queueId = initialQueue[i].id

        updateQueue(queueId, { status: 'uploading', progress: 5, startedAt: Date.now() })
        emitProgress({
          fileName: file.name,
          processed: completedCount,
          fileProgress: 5,
          status: 'uploading'
        })

        try {
          const result = await mediaDB.addMedia([file])
          processedMedia.push(...result)
          completedCount += 1

          updateQueue(queueId, { status: 'completed', progress: 100, completedAt: Date.now() })
          emitProgress({
            fileName: file.name,
            processed: completedCount,
            fileProgress: 100,
            status: 'completed'
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          updateQueue(queueId, { status: 'failed', progress: 100, completedAt: Date.now(), error: message })
          emitProgress({
            fileName: file.name,
            processed: completedCount,
            fileProgress: 100,
            status: 'failed',
            error: message
          })
          throw error
        }
      }

      console.log('✅ MediaDB 저장 완료:', processedMedia.length, '개 처리됨')

      // 갤러리용 데이터로 변환
      const galleryMedia: GalleryMediaData[] = processedMedia.map((media) => ({
        id: media.id,
        type: media.type,
        url: media.thumbnailUrl,           // 갤러리용 썸네일
        originalUrl: media.originalUrl,    // 모달용 원본
        width: media.thumbnailWidth,
        height: media.thumbnailHeight,
        fileName: media.fileName,
        customName: media.customName,      // 사용자 지정 이름
        uploadedAt: media.uploadedAt,
        duration: media.duration,
        resolution: media.resolution
      }))

      // 현재 상태에 추가
      set((state) => ({
        media: [...state.media, ...galleryMedia],
        isLoading: false
      }))

      const images = galleryMedia.filter(m => m.type === 'image').length
      const videos = galleryMedia.filter(m => m.type === 'video').length
      console.log(`✅ 미디어 추가 완료: ${galleryMedia.length}개 (이미지: ${images}, 비디오: ${videos})`)

    } catch (error) {
      console.error('❌ IndexedDB 미디어 추가 실패:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      set({ isLoading: false })
      throw error
    }
  },

  clearUploadQueue: () => set({ uploadQueue: [], overallProgress: 0 }),

  // 개별 미디어 삭제
  removeMedia: async (id: string) => {
    try {
      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      // IndexedDB에서 삭제 (로컬 시스템은 Blob으로 저장하므로 파일 삭제 불필요)
      await mediaDB.removeMedia(id)

      // 로컬 상태에서 제거
      set((state) => ({
        media: state.media.filter(media => media.id !== id)
      }))

      console.log('✅ 미디어 삭제 완료 (IndexedDB):', id)
    } catch (error) {
      console.error('❌ 미디어 삭제 실패:', error)
      throw error
    }
  },

  // 모든 미디어 삭제
  clearMedia: async () => {
    try {
      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      const currentMedia = get().media
      console.log(`🗑️ ${currentMedia.length}개 미디어 삭제 중...`)

      // IndexedDB에서 모든 데이터 삭제 (로컬 시스템은 Blob으로 저장하므로 파일 삭제 불필요)
      await mediaDB.clearAllMedia()

      // 로컬 상태 초기화
      set({ media: [] })

      console.log('✅ 모든 미디어 삭제 완료 (IndexedDB)')
    } catch (error) {
      console.error('❌ 미디어 삭제 실패:', error)
      throw error
    }
  },

  // 커스텀 이름 업데이트
  updateCustomName: async (id: string, customName: string) => {
    try {
      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      // MediaDB에서 업데이트
      await mediaDB.updateCustomName(id, customName)

      // 로컬 상태도 업데이트
      set((state) => ({
        media: state.media.map(media =>
          media.id === id ? { ...media, customName } : media
        )
      }))

      console.log('✅ 커스텀 이름 업데이트 완료:', id, customName)
    } catch (error) {
      console.error('❌ 커스텀 이름 업데이트 실패:', error)
      throw error
    }
  },

  // 저장소 통계 조회
  getStorageStats: async () => {
    try {
      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }
      return await mediaDB.getStorageStats()
    } catch (error) {
      console.error('❌ 저장소 통계 조회 실패:', error)
      return { count: 0, estimatedSize: '0 Bytes', images: 0, videos: 0 }
    }
  },

  clearUploadQueue: () => {
    set({ uploadQueue: [], overallProgress: 0 })
  },

  // 데이터 정합성 검증 및 정리
  validateAndCleanData: async () => {
    try {
      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      console.log('🔍 데이터 정합성 검증 시작...')
      const result = await mediaDB.validateAndCleanData()

      // 검증 후 미디어 다시 로드
      await get().loadMedia()

      console.log('✅ 데이터 검증 완료:', result)
      return result
    } catch (error) {
      console.error('❌ 데이터 검증 실패:', error)
      return { checkedCount: 0, repairedCount: 0, removedCount: 0, issues: [] }
    }
  },

  // 🎲 랜덤 배치 기능 구현
  shuffleMedia: () => {
    set((state) => ({
      media: shuffleArray(state.media)
    }))
    console.log('🎲 미디어 순서가 랜덤으로 섞였습니다')
  },

  getRandomMedia: (count?: number) => {
    const currentMedia = get().media
    if (!count || count >= currentMedia.length) {
      return shuffleArray(currentMedia)
    }
    return getRandomElements(currentMedia, count)
  },

  getFeaturedMedia: () => {
    const currentMedia = get().media
    // 최대 8개의 랜덤 미디어를 피처드로 선택
    const featuredCount = Math.min(8, currentMedia.length)
    return getRandomElements(currentMedia, featuredCount)
  },

  // 📊 비율 기반 배치 기능 구현
  updateRatioConfig: (config: Partial<MediaRatioConfig>) => {
    set((state) => ({
      ratioConfig: { ...state.ratioConfig, ...config }
    }))
    console.log('📊 비율 설정 업데이트:', get().ratioConfig)
  },

  arrangeByRatio: () => {
    const currentMedia = get().media
    const config = get().ratioConfig

    // 화면 크기에 따른 topVideoCount 선택
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1536
    const topVideoCount = isDesktop && config.topVideoCountDesktop
      ? config.topVideoCountDesktop
      : config.topVideoCount

    const arrangedMedia = arrangeMediaByRatio(
      currentMedia,
      config.videoRatio,
      topVideoCount
    )

    set({ media: arrangedMedia })
    console.log(`📊 비율 기반 배치 완료: 비디오 ${config.videoRatio * 100}%, 상단 ${topVideoCount}개 (${isDesktop ? '데스크탑' : '모바일'})`)
  },

  shuffleByMode: () => {
    const config = get().ratioConfig

    if (config.shuffleMode === 'ratio-based') {
      get().arrangeByRatio()
    } else {
      get().shuffleMedia()
    }
  },

  // 하위 호환성을 위한 getter와 메서드들
  get images() {
    return get().media // media를 images로도 접근 가능
  },

  addImages: async (files: File[], options?: { onProgress?: (event: {
    overallProgress: number
    fileName: string
    processed: number
    total: number
    fileProgress: number
    status: UploadStatus['status']
    error?: string
  }) => void }) => {
    console.warn('⚠️ addImages는 deprecated입니다. addMedia를 사용하세요.')
    return get().addMedia(files, options)
  },

  removeImage: async (id: string) => {
    return get().removeMedia(id)
  },

  clearImages: async () => {
    return get().clearMedia()
  },

  loadImages: async () => {
    return get().loadMedia()
  },

  // 📋 누락된 필수 함수들 구현
  updateMedia: async (id: string, updates: Partial<GalleryMediaData>) => {
    try {
      set((state) => ({
        media: state.media.map(media =>
          media.id === id ? { ...media, ...updates } : media
        )
      }))
      console.log('✅ 미디어 업데이트 완료:', id)
    } catch (error) {
      console.error('❌ 미디어 업데이트 실패:', error)
      set({ error: error instanceof Error ? error.message : '미디어 업데이트 실패' })
    }
  },

  searchMedia: (query: string) => {
    const media = get().media
    if (!query.trim()) return media

    return media.filter(item =>
      item.fileName.toLowerCase().includes(query.toLowerCase()) ||
      (item.customName && item.customName.toLowerCase().includes(query.toLowerCase()))
    )
  },

  filterByType: (type: 'image' | 'video' | 'all') => {
    const media = get().media
    if (type === 'all') return media
    return media.filter(item => item.type === type)
  },

  filterByCategory: (category: string) => {
    const media = get().media
    if (!category) return media
    // 카테고리 기능이 구현되면 여기서 필터링
    return media
  },

  sortMedia: (by: 'createdAt' | 'fileName' | 'type' | 'size', order: 'asc' | 'desc') => {
    set((state) => ({
      media: [...state.media].sort((a, b) => {
        let comparison = 0

        switch (by) {
          case 'createdAt':
            comparison = a.uploadedAt - b.uploadedAt
            break
          case 'fileName':
            comparison = a.fileName.localeCompare(b.fileName)
            break
          case 'type':
            comparison = a.type.localeCompare(b.type)
            break
          case 'size':
            // 크기 정보가 없으므로 파일명으로 대체
            comparison = a.fileName.localeCompare(b.fileName)
            break
          default:
            return 0
        }

        return order === 'desc' ? -comparison : comparison
      })
    }))
  },

  getStats: () => {
    const media = get().media
    const images = media.filter(item => item.type === 'image')
    const videos = media.filter(item => item.type === 'video')

    return {
      total: media.length,
      images: images.length,
      videos: videos.length,
      totalSize: 0, // IndexedDB에서는 정확한 크기를 알기 어려움
      averageSize: 0,
      categories: {} // 카테고리 기능 미구현
    }
  }
}))

// 하위 호환성을 위한 export
export const useImageStore = useMediaStore
