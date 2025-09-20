/**
 * 환경별 자동 스토어 선택 훅
 * 로컬: useMediaStore (IndexedDB)
 * 배포: useRailwayMediaStore (Railway PostgreSQL + Volume)
 */

import { useMediaStore } from '@/store/imageStore'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import { shouldUseRailway, getEnvironmentInfo, type EnvironmentInfo } from '@/lib/environment'
import { useEffect, useState } from 'react'
import type { MediaStore, RatioConfig } from '@/types'

interface EnvironmentStoreReturn extends MediaStore {
  isInitialized: boolean
  usingRailway: boolean
  environmentInfo: EnvironmentInfo
  updateCustomName: (id: string, newName: string) => Promise<void>
  getStorageStats: () => Promise<{ count: number; estimatedSize: string; images: number; videos: number }>
}

export const useEnvironmentStore = (): EnvironmentStoreReturn => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [usingRailway, setUsingRailway] = useState<boolean>(false)

  // 환경 감지 및 IndexedDB 간섭 차단
  useEffect(() => {
    // Railway 도메인에서는 무조건 Railway 스토리지 사용
    const isRailwayDomain = typeof window !== 'undefined' &&
                           window.location.hostname.includes('railway.app')

    const useRailway = isRailwayDomain || shouldUseRailway()
    setUsingRailway(useRailway)
    setIsInitialized(true)

    console.log('🔍 Environment Detection:', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      isRailwayDomain,
      shouldUseRailway: shouldUseRailway(),
      finalDecision: useRailway,
      forced: isRailwayDomain
    })

    // 환경 정보 상세 로깅
    const envInfo = getEnvironmentInfo()
    console.log('🔄 Environment Store Selection:', {
      ...envInfo,
      selectedStore: useRailway ? 'Railway PostgreSQL' : 'IndexedDB',
      timestamp: new Date().toISOString()
    })

    // Railway 환경에서 IndexedDB 캐시 자동 정리
    if (useRailway && typeof window !== 'undefined') {
      console.log('🚂 Railway 환경 감지 - IndexedDB 캐시 간섭 차단 시작')

      // IndexedDB 캐시 정리 함수
      const clearIndexedDBCache = async () => {
        try {
          console.log('🧹 Railway 환경: IndexedDB 캐시 자동 정리 중...')

          const databases = [
            'AIModelGallery',
            'keyval-store',
            'MediaDB',
            'tk-gallery-media-db',  // 🚀 실제 MediaDB 이름 추가
            'imageStore',
            'videoStore',
            'mediaStore'
          ]

          for (const dbName of databases) {
            try {
              await new Promise((resolve) => {
                const deleteReq = indexedDB.deleteDatabase(dbName)
                deleteReq.onsuccess = () => {
                  console.log(`✅ IndexedDB 정리 완료: ${dbName}`)
                  resolve(true)
                }
                deleteReq.onerror = () => {
                  console.log(`ℹ️ IndexedDB 정리 (이미 없음): ${dbName}`)
                  resolve(true)
                }
                deleteReq.onblocked = () => {
                  console.log(`⚠️ IndexedDB 정리 차단됨: ${dbName}`)
                  resolve(true)
                }
              })
            } catch (e) {
              console.log(`⚠️ IndexedDB 정리 오류: ${dbName}`, e)
            }
          }

          console.log('✅ Railway 환경: IndexedDB 캐시 자동 정리 완료')

        } catch (error) {
          console.log('⚠️ IndexedDB 캐시 정리 실패:', error)
        }
      }

      // 즉시 실행
      clearIndexedDBCache()

      console.log('🚂 Railway 환경 구성 완료:', {
        domain: window?.location?.hostname || 'unknown',
        protocol: window?.location?.protocol || 'unknown',
        databaseUrl: envInfo.databaseUrl ? '설정됨' : '미설정',
        railwayEnv: envInfo.railwayEnv || 'unknown',
        indexedDBCleared: true
      })
    } else {
      console.log('💻 로컬 환경 감지됨:', {
        domain: window?.location?.hostname || 'localhost',
        indexedDBAvailable: typeof window !== 'undefined' && 'indexedDB' in window
      })
    }
  }, [])

  // 스토어 선택
  const localStore = useMediaStore()
  const railwayStore = useRailwayMediaStore() // Railway Volume + PostgreSQL 사용

  const selectedStore = usingRailway ? railwayStore : localStore

  // 기본값 및 타입 안전성 보장 (필요시 재사용 가능)
  // const defaultRatioConfig: RatioConfig = {
  //   videoRatio: 0.15,
  //   topVideoCount: 3,
  //   shuffleMode: 'ratio-based'
  // }

  return {
    ...selectedStore,
    isInitialized,
    usingRailway,
    environmentInfo: getEnvironmentInfo(),
    // 비율 기반 배치 기능 - 완전한 타입 안전성 (fallback 제거)
    arrangeByRatio: selectedStore.arrangeByRatio,
    shuffleByMode: selectedStore.shuffleByMode,
    updateRatioConfig: selectedStore.updateRatioConfig,
    ratioConfig: selectedStore.ratioConfig,
    // 커스텀 네임 업데이트 기능 - 완전한 타입 안전성 (fallback 제거)
    updateCustomName: selectedStore.updateCustomName,
    // 스토리지 통계 기능 - 완전한 타입 안전성 (fallback 제거)
    getStorageStats: selectedStore.getStorageStats
  }
}