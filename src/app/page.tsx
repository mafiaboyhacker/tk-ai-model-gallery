'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import type { Media } from '@/types'

export default function Home() {
  const { media, loadMedia, isInitialized } = useEnvironmentStore()

  // GalleryMediaData를 MasonryGallery가 기대하는 Media 형태로 변환
  const convertedMedia: Media[] = media.map(item => ({
    id: item.id,
    name: item.fileName || `Media ${item.id}`,
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

  // 환경 초기화 후 미디어 로드
  useEffect(() => {
    if (isInitialized) {
      loadMedia()
    }
  }, [isInitialized, loadMedia])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        <MasonryGallery models={convertedMedia} />
      </main>

      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
