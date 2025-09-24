'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'

export default function Home() {
  const { media, loadMedia } = useRailwayMediaStore()

  // 데이터 변환
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

  // 미디어 로드
  useEffect(() => {
    loadMedia()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        <MasonryGallery models={convertedMedia} />
      </main>
      <DebugPanel />
    </div>
  )
}
