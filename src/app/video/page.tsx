'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'

// Disable static generation to prevent build-time prerendering errors
export const dynamic = 'force-dynamic'

export default function VideoPage() {
  const { media, loadMedia } = useRailwayMediaStore()

  // 데이터 변환 후 비디오만 필터링
  const videoMedia: Media[] = media
    .filter(item => item.type === 'video')
    .map(item => ({
      id: item.id,
      name: item.fileName || `Video ${item.id}`,
      imageUrl: item.url,
      originalUrl: item.originalUrl,
      imageAlt: `Video: ${item.fileName}`,
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="nav-text text-2xl text-black/90 mb-2 ml-4" style={{letterSpacing: '0.1em'}}>VIDEO GALLERY &lt;</h1>
          </div>

          <MasonryGallery models={videoMedia} />
        </div>
      </main>
      <DebugPanel />
    </div>
  )
}