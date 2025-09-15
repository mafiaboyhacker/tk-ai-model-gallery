/**
 * Supabase Storage 기반 미디어 스토어
 * 1GB 무료 저장공간으로 모든 브라우저에서 데이터 공유
 */

import { create } from 'zustand'
import {
  uploadToSupabaseStorage,
  getAllSupabaseMedia,
  deleteSupabaseMedia,
  getSupabaseStorageUsage,
  initializeSupabaseStorage,
  type SupabaseMedia
} from '@/lib/supabaseStorage'

interface SupabaseMediaStore {
  media: SupabaseMedia[]
  isLoading: boolean
  isInitialized: boolean
  storageUsage: {
    totalFiles: number
    mediaCount: number
    usagePercent: number
  }

  // 미디어 관리
  loadMedia: () => Promise<void>
  addMedia: (files: File[]) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  clearMedia: () => Promise<void>
  updateCustomName: (id: string, newName: string) => Promise<void>
  refreshStorageUsage: () => Promise<void>

  // 통계
  getStats: () => {
    total: number
    images: number
    videos: number
    totalSize: string
  }

  // 호환성을 위한 getStorageStats 메소드
  getStorageStats: () => Promise<{
    count: number
    estimatedSize: string
    images: number
    videos: number
  }>

  // 하위 호환성을 위한 메서드들 (기존 imageStore 인터페이스 유지)
  get images(): SupabaseMedia[]
  addImages: (files: File[]) => Promise<void>
  removeImage: (id: string) => Promise<void>
  clearImages: () => Promise<void>
  loadImages: () => Promise<void>
}

// 파일 크기를 사람이 읽기 쉬운 형태로 변환
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 이미지/비디오 메타데이터 추출
async function extractMediaMetadata(file: File): Promise<{
  width: number
  height: number
  duration?: number
  resolution?: string
}> {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        resolve({ width: 800, height: 600 }) // 기본값
      }
      img.src = URL.createObjectURL(file)
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
          resolution: `${video.videoWidth}x${video.videoHeight}`
        })
        URL.revokeObjectURL(video.src)
      }
      video.onerror = () => {
        resolve({
          width: 1920,
          height: 1080,
          duration: 0,
          resolution: '1920x1080'
        })
      }
      video.src = URL.createObjectURL(file)
    } else {
      resolve({ width: 800, height: 600 })
    }
  })
}

export const useSupabaseMediaStore = create<SupabaseMediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  isInitialized: false,
  storageUsage: {
    totalFiles: 0,
    mediaCount: 0,
    usagePercent: 0
  },

  // 모든 미디어 로드
  loadMedia: async () => {
    try {
      set({ isLoading: true })

      // API Route를 통한 Storage 초기화
      if (!get().isInitialized) {
        console.log('🔄 Supabase Storage 초기화 중...')
        const initResponse = await fetch('/api/supabase/storage?action=init')
        const initResult = await initResponse.json()

        if (!initResult.success) {
          throw new Error(`Storage 초기화 실패: ${initResult.error}`)
        }
        set({ isInitialized: true })
        console.log('✅ Storage 초기화 성공:', initResult.message)
      }

      console.log('🔄 API Route를 통해 Supabase 미디어 로딩 중...')
      const response = await fetch('/api/supabase/storage?action=list')
      const result = await response.json()

      if (!result.success) {
        throw new Error(`API 요청 실패: ${result.error}`)
      }

      const mediaList = result.data

      set({
        media: mediaList,
        isLoading: false
      })

      const images = mediaList.filter((m: any) => m.type === 'image').length
      const videos = mediaList.filter((m: any) => m.type === 'video').length
      console.log(`✅ Supabase 미디어 로드 완료: ${mediaList.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // 저장공간 사용량도 함께 업데이트
      await get().refreshStorageUsage()

    } catch (error) {
      console.error('❌ Supabase 미디어 로드 실패:', error)
      set({ isLoading: false })
    }
  },

  // 미디어 파일 업로드
  addMedia: async (files: File[]) => {
    try {
      set({ isLoading: true })

      if (!get().isInitialized) {
        const initialized = await initializeSupabaseStorage()
        if (!initialized) {
          throw new Error('Supabase Storage 초기화 실패')
        }
        set({ isInitialized: true })
      }

      console.log(`🔄 ${files.length}개 파일 Supabase 업로드 시작...`)

      const uploadPromises = files.map(async (file, index) => {
        try {
          console.log(`📤 업로드 중 (${index + 1}/${files.length}): ${file.name}`)

          // 메타데이터 추출
          const metadata = await extractMediaMetadata(file)

          // Supabase Storage에 업로드
          const uploadedMedia = await uploadToSupabaseStorage(file, metadata)

          console.log(`✅ 업로드 완료 (${index + 1}/${files.length}): ${file.name}`)
          return uploadedMedia
        } catch (error) {
          console.error(`❌ ${file.name} 업로드 실패:`, error)
          throw error
        }
      })

      const newMediaList = await Promise.all(uploadPromises)

      // 스토어에 추가 (최신순 정렬)
      set((state) => ({
        media: [...newMediaList, ...state.media],
        isLoading: false
      }))

      const images = newMediaList.filter(m => m.type === 'image').length
      const videos = newMediaList.filter(m => m.type === 'video').length
      console.log(`✅ 모든 파일 업로드 완료: ${newMediaList.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // 저장공간 사용량 업데이트
      await get().refreshStorageUsage()

    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error)
      set({ isLoading: false })
      throw error
    }
  },

  // 미디어 삭제
  removeMedia: async (id: string) => {
    try {
      console.log(`🗑️ 미디어 삭제 중: ${id}`)

      const success = await deleteSupabaseMedia(id)

      if (success) {
        set((state) => ({
          media: state.media.filter(media => media.id !== id)
        }))
        console.log(`✅ 미디어 삭제 완료: ${id}`)

        // 저장공간 사용량 업데이트
        await get().refreshStorageUsage()
      } else {
        throw new Error('삭제 실패')
      }
    } catch (error) {
      console.error('❌ 미디어 삭제 실패:', error)
      throw error
    }
  },

  // 모든 미디어 삭제
  clearMedia: async () => {
    try {
      console.log('🗑️ 모든 미디어 삭제 중...')

      const { media } = get()
      const deletePromises = media.map(m => deleteSupabaseMedia(m.id))

      await Promise.all(deletePromises)

      set({ media: [] })
      console.log('✅ 모든 미디어 삭제 완료')

      // 저장공간 사용량 업데이트
      await get().refreshStorageUsage()
    } catch (error) {
      console.error('❌ 전체 미디어 삭제 실패:', error)
      throw error
    }
  },

  // 저장공간 사용량 조회
  refreshStorageUsage: async () => {
    try {
      const usage = await getSupabaseStorageUsage()
      set({
        storageUsage: {
          totalFiles: usage.totalFiles,
          mediaCount: usage.mediaCount,
          usagePercent: usage.usagePercent
        }
      })

      console.log(`📊 Supabase 사용량: ${usage.mediaCount}개 파일 (${usage.usagePercent}%)`)
    } catch (error) {
      // HTML 응답이나 JSON 파싱 오류 체크
      if (error instanceof Error) {
        const errorMessage = error.message
        if (errorMessage.includes('Unexpected token') || errorMessage.includes('<html>')) {
          console.error('❌ 저장공간 사용량 조회 실패: StorageUnknownError - Supabase API가 HTML을 반환했습니다 (서비스 장애 또는 네트워크 오류)', error)
        } else {
          console.error('❌ 저장공간 사용량 조회 실패:', error)
        }
      } else {
        console.error('❌ 저장공간 사용량 조회 실패:', error)
      }
    }
  },

  // 통계 정보
  getStats: () => {
    const { media, storageUsage } = get()
    const images = media.filter(m => m.type === 'image').length
    const videos = media.filter(m => m.type === 'video').length
    const totalSize = media.reduce((sum, m) => sum + m.fileSize, 0)

    return {
      total: media.length,
      images,
      videos,
      totalSize: formatFileSize(totalSize)
    }
  },

  // 호환성을 위한 getStorageStats 메소드
  getStorageStats: async () => {
    const { media } = get()
    const images = media.filter(m => m.type === 'image').length
    const videos = media.filter(m => m.type === 'video').length
    const totalSize = media.reduce((sum, m) => sum + m.fileSize, 0)

    return {
      count: media.length,
      estimatedSize: formatFileSize(totalSize),
      images,
      videos
    }
  },

  // 미디어 이름 업데이트
  updateCustomName: async (id: string, newName: string) => {
    try {
      console.log(`✏️ 미디어 이름 업데이트: ${id} -> ${newName}`)

      // 로컬 상태 업데이트 (Supabase는 메타데이터만 저장하므로 로컬에서만 관리)
      set((state) => ({
        media: state.media.map(item =>
          item.id === id ? { ...item, fileName: newName } : item
        )
      }))

      console.log(`✅ 미디어 이름 업데이트 완료: ${id}`)
    } catch (error) {
      console.error('❌ 미디어 이름 업데이트 실패:', error)
      throw error
    }
  },

  // 하위 호환성을 위한 getter와 메서드들
  get images() {
    return get().media
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

// 기존 코드와의 호환성을 위한 export
export const useMediaStore = useSupabaseMediaStore