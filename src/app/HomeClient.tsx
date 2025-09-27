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

  // 🛡️ Enhanced data conversion with comprehensive WeakMap safety
  const convertedMedia: Media[] = useMemo(() => {
    return media
      .filter(item => {
        // Strict validation for WeakMap compatibility
        return item &&
               item.id !== null &&
               item.id !== undefined &&
               typeof item === 'object' &&
               !Array.isArray(item)
      })
      .map((item, index) => {
        // Create completely new object for WeakMap safety
        const safeItem = {
          id: String(item.id), // Ensure string ID
          name: String(item.fileName || item.customName || `Media ${item.id}`),
          imageUrl: String(item.url || ''),
          originalUrl: String(item.originalUrl || item.url || ''),
          imageAlt: String(`Media: ${item.fileName || item.id}`),
          category: String(item.type || 'image'),
          width: Math.max(100, Number(item.width) || 400), // Minimum width
          height: Math.max(100, Number(item.height) || 300), // Minimum height
          type: item.type || 'image',
          duration: item.duration || undefined,
          resolution: item.resolution || undefined,
          // WeakMap safety markers
          __weakMapSafe: true,
          __index: index,
          __timestamp: Date.now()
        }

        // Validate the object can be used as WeakMap key
        try {
          const testWeakMap = new WeakMap()
          testWeakMap.set(safeItem, 'test')
          return safeItem
        } catch (error) {
          console.warn(`🚨 Object cannot be used as WeakMap key:`, safeItem, error)
          return null
        }
      })
      .filter(item => item !== null && item.imageUrl && item.width > 0 && item.height > 0) // Remove null items and validate
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