'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import TypographicIntro from '@/components/TypographicIntro'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import type { Media } from '@/types'

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const { media, loadMedia, shuffleByMode, isInitialized, usingRailway, environmentInfo } = useEnvironmentStore()

  // 디버깅용 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Home 컴포넌트 상태:', {
      isInitialized,
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

  // 타이포그래픽 인트로 완료 핸들러
  const handleIntroComplete = () => {
    setShowIntro(false)
  }

  // 환경 초기화 후 미디어 로드
  useEffect(() => {
    if (isInitialized) {
      loadMedia()
    }
  }, [isInitialized, loadMedia])


  return (
    <div className="min-h-screen bg-white">
      {/* 타이포그래픽 인트로 - 중단 불가능, 끝까지 재생 */}
      {showIntro && <TypographicIntro onComplete={handleIntroComplete} />}

      <Header />

      <main className="pt-20">
        {!showIntro && <MasonryGallery models={convertedMedia} />}
      </main>

      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
