'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'
import Header from '@/components/Header'
import DebugPanel from '@/components/DebugPanel'

// 🚀 Dynamic import with SSR completely disabled
const MasonryGallery = dynamic(
  () => import('@/components/MasonryGallery'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <div className="text-gray-500">갤러리 로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }
)

export default function VideoClient() {
  const { media, loadMedia } = useRailwayMediaStore()

  // 데이터 변환 후 비디오만 필터링
  const videoMedia: Media[] = media
    .filter(item => item.type === 'video')
    .map(item => ({
      id: String(item.id),
      name: item.fileName || `Video ${item.id}`,
      imageUrl: item.url || '',
      originalUrl: item.originalUrl,
      imageAlt: `Video: ${item.fileName || item.id}`,
      category: item.type || 'video',
      width: Number(item.width) || 640,
      height: Number(item.height) || 360,
      type: item.type as 'video',
      duration: Number(item.duration) || undefined,
      resolution: item.resolution || undefined
    }))

  // 미디어 로드
  useEffect(() => {
    loadMedia()
  }, [loadMedia])

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