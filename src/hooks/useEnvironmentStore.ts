/**
 * 환경별 자동 스토어 선택 훅
 * 로컬: useMediaStore (IndexedDB)
 * 배포: useSupabaseMediaStore (Supabase)
 */

import { useMediaStore } from '@/store/imageStore'
import { useSupabaseMediaStore } from '@/store/supabaseMediaStore'
import { shouldUseSupabase, getEnvironmentInfo } from '@/lib/environment'
import { useEffect, useState } from 'react'

export const useEnvironmentStore = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [usingSupabase, setUsingSupabase] = useState(false)

  // 환경 감지
  useEffect(() => {
    const useSupabase = shouldUseSupabase()
    setUsingSupabase(useSupabase)
    setIsInitialized(true)

    // 환경 정보 로깅
    console.log('🔄 Environment Store Selection:', {
      ...getEnvironmentInfo(),
      selectedStore: useSupabase ? 'Supabase' : 'IndexedDB'
    })
  }, [])

  // 스토어 선택
  const localStore = useMediaStore()
  const supabaseStore = useSupabaseMediaStore()

  const selectedStore = usingSupabase ? supabaseStore : localStore

  return {
    ...selectedStore,
    isInitialized,
    usingSupabase,
    environmentInfo: getEnvironmentInfo(),
    // 랜덤화 기능 추가
    shuffleMedia: selectedStore.shuffleMedia || (() => {}),
    getRandomMedia: selectedStore.getRandomMedia || (() => []),
    getFeaturedMedia: selectedStore.getFeaturedMedia || (() => []),
    // 비율 기반 배치 기능 추가
    arrangeByRatio: selectedStore.arrangeByRatio || (() => {}),
    shuffleByMode: selectedStore.shuffleByMode || (() => {}),
    updateRatioConfig: selectedStore.updateRatioConfig || (() => {}),
    ratioConfig: selectedStore.ratioConfig || { videoRatio: 0.15, topVideoCount: 3, shuffleMode: 'ratio-based' }
  }
}