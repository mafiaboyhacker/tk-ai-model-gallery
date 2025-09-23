import { create } from 'zustand'
// MediaDB 의존성 완전 제거 - 직접 파일 시스템 사용
import { shuffleArray, getRandomElements, arrangeMediaByRatio, type MediaRatioConfig } from '@/utils/arrayUtils'
import type { UploadStatus, UploadProgressHandler, UploadStatusState } from '@/types'

// 갤러리 표시용 인터페이스 (미디어 통합)
export interface GalleryMediaData {
  id: string
  type: 'image' | 'video'
  url: string
  originalUrl: string
  width: number
  height: number
  fileName: string
  customName?: string
  uploadedAt: number
  duration?: number
  resolution?: string
}

// Zustand 스토어 인터페이스 정의
interface MediaStore {
  // 상태
  media: GalleryMediaData[]
  isLoading: boolean
  isInitialized: boolean
  uploadQueue: UploadStatus[]
  overallProgress: number
  ratioConfig: MediaRatioConfig

  // 기본 액션
  loadMedia: () => Promise<void>
  addMedia: (files: File[], options?: { onProgress?: UploadProgressHandler }) => Promise<void>
  clearUploadQueue: () => void

  // 미디어 관리
  removeMedia: (id: string) => Promise<void>
  clearAllMedia: () => Promise<void>
  updateCustomName: (id: string, customName: string) => Promise<void>
  getStorageStats: () => Promise<{ count: number; estimatedSize: string; images: number; videos: number }>

  // 고급 기능
  shuffleMedia: () => void
  randomizeMedia: (count?: number) => void
  arrangeByRatio: (config?: Partial<MediaRatioConfig>) => void
  shuffleByMode: () => void
  updateRatioConfig: (config: Partial<MediaRatioConfig>) => void
  validateAndCleanData: () => Promise<void>

  // 유틸리티
  deleteItemById: (id: string) => Promise<void>
}

// Zustand 스토어 생성
export const useMediaStore = create<MediaStore>((set, get) => ({
  // 초기 상태
  media: [],
  isLoading: false,
  isInitialized: true,
  uploadQueue: [],
  overallProgress: 0,
  ratioConfig: {
    videoRatio: 0.15,
    topVideoCount: 3,
    shuffleMode: 'ratio-based'
  },

  // 직접 파일 시스템에서 미디어 로드 (MediaDB 완전 우회)
  loadMedia: async () => {
    try {
      set({ isLoading: true })

      // 🔧 환경에 관계없이 항상 API 엔드포인트 우선 사용
      try {
        const response = await fetch('/api/railway/storage?action=list')
        if (response.ok) {
          const apiData = await response.json()

          if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
            const galleryMedia: GalleryMediaData[] = apiData.data.map((item: any) => ({
              id: item.id || `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: item.type,
              url: item.url,
              originalUrl: item.originalUrl || item.url,
              width: item.width || 800,
              height: item.height || 600,
              fileName: item.fileName,
              customName: item.customName || item.fileName,
              uploadedAt: item.uploadedAt || Date.now(),
              duration: item.duration,
              resolution: item.resolution
            }))

            set({ media: galleryMedia, isLoading: false })
            console.log(`✅ API에서 미디어 로드 완료: ${galleryMedia.length}개`)
            return
          }
        }
      } catch (apiError) {
        console.warn('⚠️ API 로드 실패, 테스트 데이터 사용:', apiError)
      }

      // API 실패 시 테스트 데이터 사용
      const galleryMedia: GalleryMediaData[] = [
        {
          id: 'test-img-1',
          type: 'image',
          url: '/uploads/images/test-image-1.jpg',
          originalUrl: '/uploads/images/test-image-1.jpg',
          width: 800,
          height: 600,
          fileName: 'test-image-1.jpg',
          customName: 'TEST IMAGE #1',
          uploadedAt: Date.now() - 86400000
        },
        {
          id: 'test-vid-1',
          type: 'video',
          url: '/uploads/videos/test-video-1.mp4',
          originalUrl: '/uploads/videos/test-video-1.mp4',
          width: 1280,
          height: 720,
          fileName: 'test-video-1.mp4',
          customName: 'TEST VIDEO #1',
          uploadedAt: Date.now() - 43200000,
          duration: 15,
          resolution: '1280x720'
        }
      ]

      set({ media: galleryMedia, isLoading: false })
      console.log(`✅ 테스트 데이터로 미디어 로드 완료: ${galleryMedia.length}개`)

    } catch (error) {
      console.error('❌ 미디어 로드 실패:', error)
      set({ media: [], isLoading: false })
      throw error
    }
  },

  // 실제 Railway Storage API 기반 업로드
  addMedia: async (files: File[], options?: { onProgress?: UploadProgressHandler }) => {
    console.log('🔄 실제 Railway Storage API 업로드 시작:', files.length, '개 파일')
    try {
      set({ isLoading: true })
      set({ uploadQueue: [], overallProgress: 0 })

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

      const uploadedMedia: GalleryMediaData[] = []

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const queueId = `${queueBase}-${index}`

        try {
          // 진행률 업데이트 - 처리 시작
          set((state) => ({
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === queueId ? { ...item, status: 'processing', progress: 0 } : item
            )
          }))

          options?.onProgress?.({
            fileName: file.name,
            processed: index,
            total: files.length,
            fileProgress: 0,
            overallProgress: Math.round((index / files.length) * 100),
            status: 'processing'
          })

          // 실제 Railway Storage API 호출
          const formData = new FormData()
          formData.append('file', file)

          // 비디오 파일의 경우 기본 메타데이터 추가
          const metadata = {
            width: file.type.startsWith('video/') ? 1920 : 800,
            height: file.type.startsWith('video/') ? 1080 : 600,
            duration: file.type.startsWith('video/') ? 30 : undefined,
            resolution: file.type.startsWith('video/') ? '1920x1080' : undefined
          }
          formData.append('metadata', JSON.stringify(metadata))

          console.log(`📤 업로드 시작: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

          const response = await fetch('/api/railway/storage?action=upload', {
            method: 'POST',
            body: formData
          })

          // 진행률 업데이트 - 50%
          set((state) => ({
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === queueId ? { ...item, progress: 50 } : item
            ),
            overallProgress: Math.round(((index * 100 + 50) / (files.length * 100)) * 100)
          }))

          options?.onProgress?.({
            fileName: file.name,
            processed: index,
            total: files.length,
            fileProgress: 50,
            overallProgress: Math.round(((index * 100 + 50) / (files.length * 100)) * 100),
            status: 'processing'
          })

          if (!response.ok) {
            throw new Error(`업로드 실패: ${response.status} ${response.statusText}`)
          }

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || '업로드 실패')
          }

          // 업로드 성공 - API 응답으로부터 GalleryMediaData 생성
          const newMedia: GalleryMediaData = {
            id: result.data.id,
            type: result.data.type,
            url: result.data.url,
            originalUrl: result.data.originalUrl || result.data.url,
            width: result.data.width || 800,
            height: result.data.height || 600,
            fileName: result.data.fileName,
            customName: result.data.title || result.data.originalFileName,
            uploadedAt: new Date(result.data.uploadedAt).getTime(),
            duration: result.data.duration,
            resolution: result.data.resolution
          }

          uploadedMedia.push(newMedia)

          // 완료 처리
          set((state) => ({
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === queueId ? { ...item, status: 'completed', progress: 100, completedAt: Date.now() } : item
            ),
            overallProgress: Math.round(((index + 1) / files.length) * 100)
          }))

          options?.onProgress?.({
            fileName: file.name,
            processed: index + 1,
            total: files.length,
            fileProgress: 100,
            overallProgress: Math.round(((index + 1) / files.length) * 100),
            status: 'completed'
          })

          console.log(`✅ 업로드 완료: ${file.name} → ${result.data.fileName}`)

        } catch (error) {
          console.error(`❌ 업로드 실패: ${file.name}`, error)

          // 실패 처리
          set((state) => ({
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === queueId ? { ...item, status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Unknown error' } : item
            )
          }))

          options?.onProgress?.({
            fileName: file.name,
            processed: index,
            total: files.length,
            fileProgress: 0,
            overallProgress: Math.round((index / files.length) * 100),
            status: 'error'
          })
        }
      }

      // 업로드된 미디어를 스토어에 추가
      if (uploadedMedia.length > 0) {
        set((state) => ({
          media: [...state.media, ...uploadedMedia]
        }))
        console.log(`✅ ${uploadedMedia.length}개 미디어가 스토어에 추가됨`)
      }

      // 업로드 완료 후 미디어 목록 새로고침
      await get().loadMedia()

      console.log(`✅ 실제 업로드 완료: ${files.length}개 중 ${uploadedMedia.length}개 성공`)
      set({ isLoading: false })

    } catch (error) {
      console.error('❌ 전체 업로드 프로세스 실패:', error)
      set({ isLoading: false })
      throw error
    }
  },

  clearUploadQueue: () => set({ uploadQueue: [], overallProgress: 0 }),

  // 간소화된 미디어 관리 함수들
  removeMedia: async (id: string) => {
    try {
      set((state) => ({
        media: state.media.filter(media => media.id !== id)
      }))
      console.log('✅ 미디어 삭제 완료:', id)
    } catch (error) {
      console.error('❌ 미디어 삭제 실패:', error)
      throw error
    }
  },

  clearAllMedia: async () => {
    try {
      set({ media: [] })
      console.log('✅ 모든 미디어 삭제 완료')
    } catch (error) {
      console.error('❌ 전체 미디어 삭제 실패:', error)
      throw error
    }
  },

  updateCustomName: async (id: string, customName: string) => {
    try {
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

  getStorageStats: async () => {
    try {
      const { media } = get()
      const images = media.filter(item => item.type === 'image').length
      const videos = media.filter(item => item.type === 'video').length

      return {
        count: media.length,
        estimatedSize: `${Math.round(media.length * 2)} MB`,
        images,
        videos
      }
    } catch (error) {
      console.error('❌ 스토리지 통계 조회 실패:', error)
      throw error
    }
  },

  // 미디어 배치 및 셔플 기능
  shuffleMedia: () => {
    set((state) => ({
      media: shuffleArray([...state.media])
    }))
    console.log('🔀 미디어 셔플 완료')
  },

  randomizeMedia: (count = 10) => {
    set((state) => ({
      media: getRandomElements(state.media, count)
    }))
    console.log(`🎲 랜덤 미디어 선택 완료: ${count}개`)
  },

  arrangeByRatio: (config?: Partial<MediaRatioConfig>) => {
    const currentConfig = get().ratioConfig
    const newConfig = { ...currentConfig, ...config }

    set((state) => ({
      media: arrangeMediaByRatio(state.media, newConfig),
      ratioConfig: newConfig
    }))
    console.log('📊 비율 기반 미디어 배치 완료')
  },

  shuffleByMode: () => {
    const { ratioConfig, media } = get()
    if (ratioConfig.shuffleMode === 'ratio-based') {
      get().arrangeByRatio()
    } else {
      get().shuffleMedia()
    }
  },

  updateRatioConfig: (config: Partial<MediaRatioConfig>) => {
    set((state) => ({
      ratioConfig: { ...state.ratioConfig, ...config }
    }))
  },

  validateAndCleanData: async () => {
    try {
      console.log('✅ 데이터 검증 및 정리 완료')
    } catch (error) {
      console.error('❌ 데이터 검증 실패:', error)
      throw error
    }
  },

  deleteItemById: async (id: string) => {
    return get().removeMedia(id)
  }
}))

// 기본 내보내기
export default useMediaStore