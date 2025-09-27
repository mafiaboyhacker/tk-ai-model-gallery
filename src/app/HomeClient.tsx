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

  // 🛡️ Ultra-safe WeakMap-compatible data conversion
  const convertedMedia: Media[] = useMemo(() => {
    if (!Array.isArray(media) || media.length === 0) {
      console.log('📋 No media data available')
      return []
    }

    return media
      .filter((item, filterIndex) => {
        // Enhanced validation with detailed logging
        const isValid = item &&
                       typeof item === 'object' &&
                       !Array.isArray(item) &&
                       item.id !== null &&
                       item.id !== undefined &&
                       String(item.id).length > 0

        if (!isValid) {
          console.warn(`🚨 Filtering invalid item at index ${filterIndex}:`, item)
        }
        return isValid
      })
      .map((item, mapIndex) => {
        // Create ultra-safe object with all required properties
        const safeItem = {
          // Core required properties
          id: String(item.id),
          name: String(item.fileName || item.title || item.customName || `Media ${item.id}`),
          imageUrl: String(item.url || `/api/media/${item.id}`),
          originalUrl: String(item.originalUrl || item.url || `/api/media/${item.id}`),
          imageAlt: String(`Media: ${item.fileName || item.title || item.id}`),
          category: String(item.type || 'image'),

          // Safe numeric properties with validation
          width: (() => {
            const w = Number(item.width)
            return isNaN(w) || w <= 0 ? 400 : Math.max(100, w)
          })(),
          height: (() => {
            const h = Number(item.height)
            return isNaN(h) || h <= 0 ? 300 : Math.max(100, h)
          })(),

          // Optional properties with safe defaults
          type: String(item.type || 'image'),
          duration: item.duration || undefined,
          resolution: item.resolution || undefined,

          // WeakMap safety markers with unique values
          __weakMapSafe: true,
          __itemIndex: mapIndex,
          __timestamp: Date.now(),
          __sessionId: `safe_${Date.now()}_${mapIndex}`,
          __objectRef: Symbol(`media_${item.id}_${mapIndex}`) // Unique symbol for each object
        }

        // Triple validation for WeakMap compatibility
        try {
          // Test 1: Basic WeakMap test
          const testWeakMap1 = new WeakMap()
          testWeakMap1.set(safeItem, 'test1')

          // Test 2: Second WeakMap with different value
          const testWeakMap2 = new WeakMap()
          testWeakMap2.set(safeItem, { test: 'test2' })

          // Test 3: Verify we can retrieve values
          const retrieved1 = testWeakMap1.get(safeItem)
          const retrieved2 = testWeakMap2.get(safeItem)

          if (retrieved1 !== 'test1' || !retrieved2 || retrieved2.test !== 'test2') {
            throw new Error('WeakMap value retrieval failed')
          }

          return safeItem
        } catch (weakMapError) {
          console.error(`🚨 WeakMap validation failed for item ${item.id}:`, {
            error: weakMapError,
            item: safeItem,
            originalItem: item
          })

          // Return a completely new object as last resort
          return {
            id: String(item.id),
            name: String(item.fileName || `Fallback ${item.id}`),
            imageUrl: `/api/media/${item.id}`,
            originalUrl: `/api/media/${item.id}`,
            imageAlt: `Media: ${item.id}`,
            category: 'image',
            width: 400,
            height: 300,
            type: 'image',
            __fallback: true,
            __timestamp: Date.now()
          }
        }
      })
      .filter((item) => {
        // Final validation
        const isValidFinal = item &&
                           item.id &&
                           item.imageUrl &&
                           item.width > 0 &&
                           item.height > 0

        if (!isValidFinal) {
          console.warn('🚨 Final validation failed:', item)
        }
        return isValidFinal
      })
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