'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import type { Media } from '@/types'

export default function Home() {
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

  // 즉시 미디어 로딩 실행 (useEffect 우회)
  if (isInitialized && !isLoaded) {
    console.log('🚀 page.tsx 즉시 미디어 로딩 시작:', { isInitialized, usingRailway })

    const initializeMedia = async () => {
      console.log('🔧 initializeMedia 함수 호출됨:', { isInitialized, usingRailway })

      try {
        await loadMedia()
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${usingRailway ? 'Railway' : 'Local'} 미디어 로드 성공:`, media.length, '개')
        }

        // 📊 미디어 로드 후 비율 기반 자동 배치 (비디오 우선 상단, 반응형)
        setTimeout(() => {
          shuffleByMode?.()
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 메인 페이지: 비율 기반 미디어 배치 완료 (비디오 15%, 반응형 상단 배치)')
          }
        }, 100) // 약간의 지연을 주어 상태 업데이트 완료 보장

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ ${usingRailway ? 'Railway' : 'Local'} 미디어 로드 실패:`, error)
        }
      } finally {
        setIsLoaded(true)
      }
    }

    initializeMedia()
  }

  // 미디어 로드 완료 시 추가 로깅
  useEffect(() => {
    if (media.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 메인 페이지: ${media.length}개 미디어 감지됨, 갤러리 업데이트`)
      }
    }
  }, [media])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        {isLoaded ? (
          <MasonryGallery models={convertedMedia} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">
              Loading {usingRailway ? 'Railway' : 'Local'} media...
              {!isInitialized && ' (환경 감지 중...)'}
            </div>
          </div>
        )}
      </main>

      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
