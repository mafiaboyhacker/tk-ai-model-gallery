'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="text-3xl font-bold text-black/90 mb-2">VIDEO GALLERY</h1>
          <p className="text-gray-600">동영상 전용 갤러리</p>
        </div>
        <MasonryGallery models={videoMedia} />
      </main>
      <DebugPanel />
    </div>
  )
}