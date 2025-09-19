/**
 * Railway Volume + PostgreSQL 통합 미디어 스토어
 * /app/uploads 디렉토리에 파일 저장 + PostgreSQL에 메타데이터 저장
 */

import { create } from 'zustand'
import type { MediaStore, GalleryMediaData, RatioConfig } from '@/types'

interface RailwayMediaStore extends MediaStore {
  isLoading: boolean
  error: string | null
}

export const useRailwayMediaStore = create<RailwayMediaStore>((set, get) => ({
  // 상태
  media: [],
  isLoading: false,
  error: null,
  selectedMedia: null,

  // 기본 비율 설정
  ratioConfig: {
    videoRatio: 0.15,
    topVideoCount: 3,
    shuffleMode: 'ratio-based' as const
  },

  // 미디어 로드
  loadMedia: async () => {
    set({ isLoading: true, error: null })

    try {
      console.log('🔄 Railway: 미디어 목록 로드 시작')

      const response = await fetch('/api/railway/storage?action=list')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to load media')
      }

      console.log(`✅ Railway: ${data.data.length}개 미디어 로드 성공`)
      set({ media: data.data, isLoading: false })

    } catch (error) {
      console.error('❌ Railway: 미디어 로드 실패:', error)
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  },

  // 미디어 추가
  addMedia: async (files: File[]) => {
    set({ isLoading: true, error: null })

    try {
      console.log(`🔄 Railway: ${files.length}개 파일 업로드 시작`)

      const uploadResults = []
      const currentMedia = get().media

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/railway/storage?action=upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || `Upload failed for ${file.name}`)
        }

        uploadResults.push(data.data)
        console.log(`✅ Railway: ${file.name} 업로드 성공`)
      }

      // 상태 업데이트 - 새로운 파일들을 앞에 추가
      set({
        media: [...uploadResults, ...currentMedia],
        isLoading: false
      })

      console.log(`✅ Railway: 총 ${uploadResults.length}개 파일 업로드 완료`)

    } catch (error) {
      console.error(`❌ Railway: 파일 업로드 실패:`, error)
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
      console.log(`🗑️ Railway: ${id} 삭제 시작`)

      const response = await fetch(`/api/railway/storage?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Delete failed')
      }

      console.log(`✅ Railway: ${id} 삭제 성공`)

      // 상태 업데이트
      const currentMedia = get().media
      set({
        media: currentMedia.filter(item => item.id !== id),
        isLoading: false
      })

    } catch (error) {
      console.error(`❌ Railway: ${id} 삭제 실패:`, error)
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
      console.log(`🔄 Railway: ${id} 이름 변경: ${newName}`)

      // PostgreSQL에서 title 업데이트 API 호출
      const response = await fetch('/api/railway/storage', {
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

      console.log(`✅ Railway: ${id} 이름 변경 성공`)

    } catch (error) {
      console.error(`❌ Railway: ${id} 이름 변경 실패:`, error)
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

  // 비율 기반 배치
  arrangeByRatio: () => {
    const { media, ratioConfig } = get()
    if (!media.length || !ratioConfig) return []

    const images = media.filter(m => m.type === 'image')
    const videos = media.filter(m => m.type === 'video')

    const targetVideoCount = Math.min(
      Math.floor(media.length * ratioConfig.videoRatio),
      ratioConfig.topVideoCount,
      videos.length
    )

    const selectedVideos = videos.slice(0, targetVideoCount)
    const remainingSlots = media.length - selectedVideos.length
    const selectedImages = images.slice(0, remainingSlots)

    return [...selectedVideos, ...selectedImages]
  },

  // 모드별 셔플
  shuffleByMode: (mode?: 'random' | 'ratio-based' | 'video-first' | 'image-first') => {
    const { media, arrangeByRatio, ratioConfig } = get()
    const shuffleMode = mode || ratioConfig?.shuffleMode || 'random'

    switch (shuffleMode) {
      case 'ratio-based':
        return arrangeByRatio ? arrangeByRatio() : [...media].sort(() => Math.random() - 0.5)
      case 'video-first':
        const videos = media.filter(m => m.type === 'video')
        const images = media.filter(m => m.type === 'image')
        return [...videos, ...images]
      case 'image-first':
        const imgs = media.filter(m => m.type === 'image')
        const vids = media.filter(m => m.type === 'video')
        return [...imgs, ...vids]
      case 'random':
      default:
        return [...media].sort(() => Math.random() - 0.5)
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
    try {
      console.log('🗑️ Railway: 전체 미디어 삭제 시작')

      const currentMedia = get().media
      for (const item of currentMedia) {
        await get().removeMedia(item.id)
      }

      console.log('✅ Railway: 전체 미디어 삭제 완료')

    } catch (error) {
      console.error('❌ Railway: 전체 미디어 삭제 실패:', error)
      throw error
    }
  },

  // MediaStore 인터페이스 호환성을 위한 추가 메서드들
  removeMedia: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      console.log(`🗑️ Railway: ${id} 삭제 시작`)

      const response = await fetch(`/api/railway/storage?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Delete failed')
      }

      console.log(`✅ Railway: ${id} 삭제 성공`)

      // 상태 업데이트
      const currentMedia = get().media
      set({
        media: currentMedia.filter(item => item.id !== id),
        isLoading: false
      })

    } catch (error) {
      console.error(`❌ Railway: ${id} 삭제 실패:`, error)
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isLoading: false
      })
      throw error
    }
  },
  updateMedia: async (id: string, updates: Partial<GalleryMediaData>) => {
    // TODO: Railway API에 updateMedia 엔드포인트 추가 필요
    console.log('updateMedia는 아직 구현되지 않음')
  },
  clearMedia: async () => {
    try {
      console.log('🗑️ Railway: 전체 미디어 삭제 시작')

      const currentMedia = get().media
      for (const item of currentMedia) {
        await get().removeMedia(item.id)
      }

      console.log('✅ Railway: 전체 미디어 삭제 완료')

    } catch (error) {
      console.error('❌ Railway: 전체 미디어 삭제 실패:', error)
      throw error
    }
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
    console.log('sortMedia는 아직 구현되지 않음')
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
      console.log('📊 Railway: PostgreSQL 기반 저장소 통계 계산 시작')

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

      console.log('✅ Railway: PostgreSQL 통계 계산 완료:', {
        ...result,
        totalSizeBytes,
        dataSource: 'Railway PostgreSQL (실제 데이터)',
        timestamp: new Date().toISOString()
      })

      return result

    } catch (error) {
      console.error('❌ Railway: 저장소 통계 계산 실패:', error)
      return {
        count: 0,
        estimatedSize: '0 Bytes',
        images: 0,
        videos: 0
      }
    }
  }
}))