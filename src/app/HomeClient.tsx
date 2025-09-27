'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import type { Media } from '@/types'
import Header from '@/components/Header'
import DebugPanel from '@/components/DebugPanel'
import MasonryGallery from '@/components/MasonryGallery'

export default function HomeClient() {
  const { media, loadMedia, shuffleByMode } = useRailwayMediaStore()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  // 🛡️ Simple and safe data conversion
  const convertedMedia: Media[] = useMemo(() => {
    if (!Array.isArray(media) || media.length === 0) {
      return []
    }

    return media
      .filter((item) => item && item.id && item.url)
      .map((item) => ({
        id: String(item.id),
        name: String(item.fileName || item.title || item.customName || `Media ${item.id}`),
        imageUrl: String(item.url || `/api/media/${item.id}`),
        originalUrl: String(item.originalUrl || item.url || `/api/media/${item.id}`),
        imageAlt: String(`Media: ${item.fileName || item.title || item.id}`),
        category: String(item.type || 'image'),
        width: Number(item.width) || 400,
        height: Number(item.height) || 300,
        type: String(item.type || 'image') as 'image' | 'video',
        duration: item.duration,
        resolution: item.resolution,
      }))
  }, [media])

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
  }, [loadMedia, shuffleByMode])

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