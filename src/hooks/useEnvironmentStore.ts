/**
 * Railway 전용 스토어 (환경감지 제거)
 * 모든 환경에서 Railway PostgreSQL + Volume 사용
 */

import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { MediaStore } from '@/types'

interface EnvironmentStoreReturn extends MediaStore {
  isInitialized: boolean
  usingRailway: boolean
  environmentInfo: { environment: 'Railway'; dbConnected: true }
  updateCustomName: (id: string, newName: string) => Promise<void>
  getStorageStats: () => Promise<{ count: number; estimatedSize: string; images: number; videos: number }>
  clearAllMedia?: () => Promise<void>
  clearVideos?: () => Promise<void>
  clearImages?: () => Promise<void>
}

export function useEnvironmentStore(): EnvironmentStoreReturn {
  const railwayStore = useRailwayMediaStore()

  // Railway 전용 반환 (환경감지 완전 제거)
  return {
    ...railwayStore,
    isInitialized: true,
    usingRailway: true,
    environmentInfo: { environment: 'Railway', dbConnected: true },
    updateCustomName: railwayStore.updateCustomName,
    getStorageStats: railwayStore.getStorageStats,
    clearAllMedia: railwayStore.clearAllMedia,
    clearVideos: railwayStore.clearVideos,
    clearImages: railwayStore.clearImages
  }
}