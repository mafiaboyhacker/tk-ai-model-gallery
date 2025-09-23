'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import TypographicIntro from '@/components/TypographicIntro'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import type { Media } from '@/types'

type LoadingPhase = 'intro' | 'priority' | 'complete'

export default function Home() {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('intro')
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia, shuffleByMode, isInitialized, usingRailway, environmentInfo } = useEnvironmentStore()

  // 디버깅용 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Home 컴포넌트 상태:', {
      isInitialized,
      isLoaded,
      mediaCount: media.length,
      usingRailway
    })
  }

  // GalleryMediaData를 MasonryGallery가 기대하는 Media 형태로 변환
  const convertedMedia: Media[] = media.map(item => ({
    id: item.id,
    name: item.customName || item.fileName || `Media ${item.id}`,
    imageUrl: item.url,
    originalUrl: item.originalUrl,
    imageAlt: `Media: ${item.fileName}`,
    category: item.type,
    width: item.width,
    height: item.height,
    type: item.type,
    duration: item.duration,
    resolution: item.resolution
  }))

  // 🎯 3단계 로딩 시퀀스
  useEffect(() => {
    if (!isInitialized) return

    let timeoutId: NodeJS.Timeout

    const initializeSequence = async () => {
      // Phase 1: 타이포그래픽 인트로 (백그라운드에서 미디어 로딩 시작)
      console.log('🎨 Phase 1: 타이포그래픽 인트로 시작')

      // 백그라운드에서 미디어 로딩 시작
      const mediaLoadPromise = loadMedia().then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ 백그라운드 미디어 로드 완료: ${media.length}개`)
        }
      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 미디어 로드 실패:', error)
        }
      })

      // 1.5초 후 Phase 2로 전환
      timeoutId = setTimeout(async () => {
        setLoadingPhase('priority')
        console.log('🎯 Phase 2: 우선 갤러리 시작')

        // 미디어 로딩 완료 대기
        await mediaLoadPromise

        // 배치 최적화
        shuffleByMode?.()
        setIsLoaded(true)

        // 0.5초 후 완전 갤러리로 전환
        setTimeout(() => {
          setLoadingPhase('complete')
          console.log('🚀 Phase 3: 완전 갤러리 완료')
        }, 500)
      }, 1500)
    }

    initializeSequence()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isInitialized, loadMedia, shuffleByMode])

  // 미디어 로드 완료 시 추가 로깅
  useEffect(() => {
    if (media.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 메인 페이지: ${media.length}개 미디어 감지됨, 갤러리 업데이트`)
      }
    }
  }, [media])

  // 타이포그래픽 인트로 완료 핸들러
  const handleIntroComplete = () => {
    setLoadingPhase('priority')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Phase 1: 타이포그래픽 인트로 */}
      {loadingPhase === 'intro' && (
        <TypographicIntro
          onComplete={handleIntroComplete}
          duration={1500}
        />
      )}

      {/* Phase 2-3: 헤더 + 갤러리 */}
      {loadingPhase !== 'intro' && (
        <>
          <Header />

          <main className="pt-20">
            {isLoaded ? (
              <MasonryGallery
                models={convertedMedia}
                loading={loadingPhase === 'priority'}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                  <div className="text-gray-500">
                    갤러리를 준비하고 있습니다...
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Development Debug Panel */}
          <DebugPanel />
        </>
      )}
    </div>
  )
}
