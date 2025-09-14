/**
 * Vercel Blob Storage 기반 미디어 스토어
 * IndexedDB를 대체하여 모든 브라우저에서 데이터 공유
 */

import { create } from 'zustand'
import {
  uploadToVercelBlob,
  getAllUploadedMedia,
  deleteMedia,
  getStorageUsage,
  type UploadedMedia
} from '@/lib/vercelBlobStorage'

interface BlobMediaStore {
  media: UploadedMedia[]
  isLoading: boolean
  storageUsage: {
    totalSize: number
    totalCount: number
    mediaCount: number
    usagePercent: number
  }

  // 미디어 관리
  loadMedia: () => Promise<void>
  addMedia: (files: File[]) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  clearMedia: () => Promise<void>
  refreshStorageUsage: () => Promise<void>

  // 통계
  getStats: () => {
    total: number
    images: number
    videos: number
    totalSize: string
  }
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

export const useBlobMediaStore = create<BlobMediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  storageUsage: {
    totalSize: 0,
    totalCount: 0,
    mediaCount: 0,
    usagePercent: 0
  },

  // 모든 미디어 로드
  loadMedia: async () => {
    try {
      set({ isLoading: true })
      console.log('🔄 Vercel Blob에서 미디어 로딩 중...')

      const mediaList = await getAllUploadedMedia()

      set({
        media: mediaList,
        isLoading: false
      })

      const images = mediaList.filter(m => m.type === 'image').length
      const videos = mediaList.filter(m => m.type === 'video').length
      console.log(`✅ Vercel Blob 미디어 로드 완료: ${mediaList.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // 저장공간 사용량도 함께 업데이트
      await get().refreshStorageUsage()

    } catch (error) {
      console.error('❌ Vercel Blob 미디어 로드 실패:', error)
      set({ isLoading: false })
    }
  },

  // 미디어 파일 업로드
  addMedia: async (files: File[]) => {
    try {
      set({ isLoading: true })
      console.log(`🔄 ${files.length}개 파일 업로드 시작...`)

      const uploadPromises = files.map(async (file) => {
        try {
          // 메타데이터 추출
          const metadata = await extractMediaMetadata(file)

          // Vercel Blob에 업로드
          const uploadedMedia = await uploadToVercelBlob(file, metadata)

          console.log(`✅ 업로드 완료: ${file.name}`)
          return uploadedMedia
        } catch (error) {
          console.error(`❌ ${file.name} 업로드 실패:`, error)
          throw error
        }
      })

      const newMediaList = await Promise.all(uploadPromises)

      // 스토어에 추가
      set((state) => ({
        media: [...state.media, ...newMediaList],
        isLoading: false
      }))

      console.log(`✅ 모든 파일 업로드 완료: ${newMediaList.length}개`)

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

      const success = await deleteMedia(id)

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
      const deletePromises = media.map(m => deleteMedia(m.id))

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
      const usage = await getStorageUsage()
      set({ storageUsage: usage })

      console.log(`📊 저장공간 사용량: ${formatFileSize(usage.totalSize)} (${usage.usagePercent}%)`)
    } catch (error) {
      console.error('❌ 저장공간 사용량 조회 실패:', error)
    }
  },

  // 통계 정보
  getStats: () => {
    const { media, storageUsage } = get()
    const images = media.filter(m => m.type === 'image').length
    const videos = media.filter(m => m.type === 'video').length

    return {
      total: media.length,
      images,
      videos,
      totalSize: formatFileSize(storageUsage.totalSize)
    }
  }
}))

// 기존 imageStore와 호환성을 위한 래퍼
export const useMediaStore = useBlobMediaStore