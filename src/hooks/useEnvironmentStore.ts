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
  console.log('🚀 useEnvironmentStore 훅이 호출됨')

  // 환경 감지를 즉시 수행 (useEffect 우회)
  const isRailwayDomain = typeof window !== 'undefined' &&
                         window.location.hostname.includes('railway.app')
  const useRailway = isRailwayDomain || shouldUseRailway()

  console.log('🔧 즉시 환경 감지 수행:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isRailwayDomain,
    shouldUseRailway: shouldUseRailway(),
    finalDecision: useRailway,
    forced: isRailwayDomain
  })

  const [isInitialized, setIsInitialized] = useState<boolean>(true) // 즉시 true로 설정
  const [usingRailway, setUsingRailway] = useState<boolean>(useRailway) // 즉시 환경값 설정

  console.log('✅ 즉시 초기화 완료:', { isInitialized: true, usingRailway: useRailway })

  // 환경 감지 및 IndexedDB 정리 - 즉시 실행
  if (useRailway && typeof window !== 'undefined') {
    console.log('🚂 Railway 환경 감지 - IndexedDB 캐시 간섭 차단 시작')

    // IndexedDB 캐시 정리 함수 (즉시 실행)
    const clearIndexedDBCache = async () => {
      try {
        console.log('🧹 Railway 환경: IndexedDB 캐시 자동 정리 중...')

        const databases = [
          'AIModelGallery',
          'keyval-store',
          'MediaDB',
          'tk-gallery-media-db',
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
      indexedDBCleared: true
    })
  } else {
    console.log('💻 로컬 환경 감지됨:', {
      domain: typeof window !== 'undefined' ? window?.location?.hostname || 'localhost' : 'server',
      indexedDBAvailable: typeof window !== 'undefined' && 'indexedDB' in window
    })
  }

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