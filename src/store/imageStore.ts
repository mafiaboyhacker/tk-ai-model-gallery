import { create } from 'zustand'
import { mediaDB, type MediaData } from '@/lib/mediaDB'

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

interface MediaStore {
  media: GalleryMediaData[]   // 갤러리용 미디어 데이터
  isLoading: boolean
  isInitialized: boolean
  addMedia: (files: File[]) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  clearMedia: () => Promise<void>
  loadMedia: () => Promise<void>
  updateCustomName: (id: string, customName: string) => Promise<void>
  getStorageStats: () => Promise<{ count: number; estimatedSize: string; images: number; videos: number }>

  // 하위 호환성을 위한 메서드들
  get images(): GalleryMediaData[]
  addImages: (files: File[]) => Promise<void>
  removeImage: (id: string) => Promise<void>
  clearImages: () => Promise<void>
  loadImages: () => Promise<void>
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  isInitialized: false,

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
  addMedia: async (files: File[]) => {
    try {
      set({ isLoading: true })

      if (!get().isInitialized) {
        await mediaDB.init()
        set({ isInitialized: true })
      }

      // MediaDB에 저장 (이미지와 비디오 모두 처리)
      const processedMedia = await mediaDB.addMedia(files)

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
      console.error('❌ 미디어 추가 실패:', error)
      set({ isLoading: false })
      throw error
    }
  },

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

  // 하위 호환성을 위한 getter와 메서드들
  get images() {
    return get().media // media를 images로도 접근 가능
  },

  addImages: async (files: File[]) => {
    console.warn('⚠️ addImages는 deprecated입니다. addMedia를 사용하세요.')
    return get().addMedia(files)
  },

  removeImage: async (id: string) => {
    return get().removeMedia(id)
  },

  clearImages: async () => {
    return get().clearMedia()
  },

  loadImages: async () => {
    return get().loadMedia()
  }
}))

// 하위 호환성을 위한 export
export const useImageStore = useMediaStore