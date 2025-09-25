'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'

// Disable static generation to prevent build-time prerendering errors
export const dynamic = 'force-dynamic'

export default function Home() {
  const { media, loadMedia, shuffleByMode } = useRailwayMediaStore()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

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

  // 필터링된 미디어 (video 필터 적용)
  const filteredMedia = useMemo(() => {
    if (filter === 'video') {
      return convertedMedia.filter(item => item.type === 'video')
    }
    return convertedMedia
  }, [convertedMedia, filter])

  // 미디어 로드 후 가중치 랜덤 배치 적용
  useEffect(() => {
    const initializeMedia = async () => {
      await loadMedia()
      // 가중치 랜덤 배치 적용 (동영상이 더 자주 나타나도록)
      shuffleByMode('weighted-random')
    }
    initializeMedia()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        <MasonryGallery models={filteredMedia} />
      </main>
      <DebugPanel />
    </div>
  )
}
