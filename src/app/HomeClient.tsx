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

  // 데이터 변환 (WeakMap 에러 방지를 위한 안전한 기본값 설정)
  const convertedMedia: Media[] = media
    .filter(item => item && item.id) // null/undefined 항목 필터링
    .map(item => ({
      id: String(item.id), // 문자열로 확실히 변환
      name: item.fileName || item.customName || `Media ${item.id}`,
      imageUrl: item.url || '',
      originalUrl: item.originalUrl || item.url || '',
      imageAlt: `Media: ${item.fileName || item.id}`,
      category: item.type || 'image',
      width: Number(item.width) || 400, // 기본 너비
      height: Number(item.height) || 300, // 기본 높이
      type: item.type || 'image',
      duration: item.duration || undefined,
      resolution: item.resolution || undefined
    }))
    .filter(item => item.imageUrl && item.width > 0 && item.height > 0) // 유효한 데이터만

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