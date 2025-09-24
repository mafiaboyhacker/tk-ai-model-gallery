'use client'

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import {
  Masonry,
  usePositioner,
  useContainerPosition,
  useScroller,
  useResizeObserver
} from 'masonic'
import SafeModelCard from './SafeModelCard'
// import { useImageStore } from '@/store/imageStore' // 더 이상 사용하지 않음


interface Media {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string  // 원본 URL 추가
  imageAlt: string
  category: string
  width: number
  height: number
  type?: 'image' | 'video'  // 미디어 타입 추가
  duration?: number         // 비디오 재생 시간
  resolution?: string       // 비디오 해상도
  colSpan?: number         // 스마트 배치를 위한 열 스팬
}

interface MasonryGalleryProps {
  models: Media[]
  loading?: boolean
}

// 🚀 Advanced Masonic implementation with hooks
const MasonryGallery = memo(function MasonryGallery({ models, loading = false }: MasonryGalleryProps) {
  const [mounted, setMounted] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)
  const [windowHeight, setWindowHeight] = useState(800)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Window size tracking
  useEffect(() => {
    setMounted(true)

    const updateWindowSize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }

    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)
    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])

  // Filtered media based on current page
  const allMedia = useMemo(() => {
    // Always process data, don't wait for mounted state
    const isModelPage = mounted && typeof window !== 'undefined' && window.location.pathname === '/model'
    const isVideoPage = mounted && typeof window !== 'undefined' && window.location.pathname === '/video'

    let filteredMedia = models
    if (isModelPage) {
      filteredMedia = models.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filteredMedia = models.filter(media => media.type === 'video')
    }

    return filteredMedia
  }, [models, mounted])

  // 🚀 Advanced Masonic hooks integration with WeakMap safety
  const { offset, width } = useContainerPosition(containerRef, [windowWidth, windowHeight])

  // ✅ DEBUGGING: Log offset type and value for WeakMap troubleshooting
  if (process.env.NODE_ENV === 'development' && offset) {
    console.log('🔍 Offset debug:', {
      type: typeof offset,
      value: offset,
      isObject: typeof offset === 'object',
      isNull: offset === null,
      constructor: offset?.constructor?.name
    })
  }

  // 🛡️ WeakMap safety: Ensure offset is a valid object (not primitive)
  const createSafeOffset = () => {
    if (offset && typeof offset === 'object' && offset !== null && !Array.isArray(offset)) {
      return offset
    }
    // Return a safe default object that WeakMap can use as key
    return { top: 0, left: 0, element: containerRef.current }
  }

  const safeOffset = createSafeOffset()
  const { scrollTop, isScrolling } = useScroller(safeOffset)

  // Dynamic column calculation based on width
  const columnConfig = useMemo(() => {
    // Ensure we always have a valid width for column calculation
    const availableWidth = width > 0 ? width : windowWidth
    let columnCount = 2
    let columnWidth = 300

    if (availableWidth >= 1536) {
      columnCount = 6
      columnWidth = Math.floor((availableWidth - 64) / 6) - 4
    } else if (availableWidth >= 1280) {
      columnCount = 6
      columnWidth = Math.floor((availableWidth - 64) / 6) - 4
    } else if (availableWidth >= 1024) {
      columnCount = 5
      columnWidth = Math.floor((availableWidth - 64) / 5) - 4
    } else if (availableWidth >= 768) {
      columnCount = 4
      columnWidth = Math.floor((availableWidth - 64) / 4) - 4
    } else if (availableWidth >= 640) {
      columnCount = 3
      columnWidth = Math.floor((availableWidth - 64) / 3) - 4
    } else {
      columnCount = 2
      columnWidth = Math.floor((availableWidth - 64) / 2) - 4
    }

    return { columnCount, columnWidth }
  }, [width, windowWidth])

  const positioner = usePositioner({
    width: width > 0 ? width : windowWidth,
    columnWidth: columnConfig.columnWidth,
    columnGutter: 4,
    rowGutter: 4
  }, [width, windowWidth, columnConfig.columnWidth])

  // ✅ DEBUGGING: Validate positioner for WeakMap compatibility
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Positioner debug:', {
      type: typeof positioner,
      isObject: typeof positioner === 'object',
      isNull: positioner === null,
      hasKeys: positioner ? Object.keys(positioner).length : 0
    })
  }

  // 🚀 Resize observer for dynamic height changes (client-only)
  const resizeObserver = typeof window !== 'undefined' ? useResizeObserver(positioner) : null

  // Dynamic overscanBy calculation based on screen size and performance
  const dynamicOverscanBy = useMemo(() => {
    // Higher initial overscan to ensure top items are rendered
    const baseOverscan = !mounted ? 15 : 8 // Higher initial value

    const screenMultiplier = windowHeight > 1000 ? 1.5 : 1
    const itemCountMultiplier = allMedia.length > 100 ? 1.2 : 1

    return Math.ceil(baseOverscan * screenMultiplier * itemCountMultiplier)
  }, [mounted, windowHeight, allMedia.length])

  const MasonryCard = useCallback(({ index, data, width }: { index: number, data: Media, width: number }) => {
    // 16:9 landscape images get larger height for better visibility
    const aspectRatio = data.width / data.height
    const calculateHeight = () => {
      if (aspectRatio >= 1.6) {
        // For 16:9 and wider landscape images, ensure minimum height (much smaller)
        return Math.max(120, width / aspectRatio)
      }
      return width / aspectRatio
    }

    return (
      <SafeModelCard
        key={data.id}
        id={data.id}
        name={data.name}
        imageUrl={data.imageUrl}
        originalUrl={data.originalUrl}
        imageAlt={data.imageAlt}
        category={data.category}
        width={width}
        height={calculateHeight()}
        type={data.type}
        duration={data.duration}
        resolution={data.resolution}
        isAdminMode={false}
      />
    )
  }, [])

  // 🚀 Enhanced skeleton loading with realistic aspect ratios
  const SkeletonLoader = useMemo(() => {
    // Realistic aspect ratios for different media types
    const aspectRatios = [
      16/9,   // landscape video
      9/16,   // portrait video
      4/3,    // square-ish image
      3/4,    // portrait image
      2/1,    // wide banner
      1/1     // perfect square
    ]

    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const columnWidth = (containerWidth - 32) / columnConfig.columnCount - 2

    return Array.from({ length: 12 }).map((_, index) => {
      const aspectRatio = aspectRatios[index % aspectRatios.length]
      const height = Math.max(120, columnWidth / aspectRatio)

      return (
        <div
          key={index}
          className="bg-gray-100 rounded-lg mb-2 animate-pulse relative overflow-hidden"
          style={{ height }}
        >
          {/* Simplified shimmer - only on some items to reduce CPU load */}
          {index % 3 === 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          )}

          {/* Video indicator for some items */}
          {index % 3 === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-200 rounded-full p-2 animate-pulse">
                <div className="w-4 h-4 bg-gray-300 rounded-sm" />
              </div>
            </div>
          )}
        </div>
      )
    })
  }, [columnConfig.columnCount])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`, gap: '2px' }}>
          {SkeletonLoader}
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <div className="text-gray-500 text-sm">갤러리 로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ DEBUGGING: Final validation before Masonry render
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Final Masonry props validation:', {
      allMediaType: typeof allMedia,
      allMediaLength: allMedia?.length || 0,
      positionerType: typeof positioner,
      scrollTopType: typeof scrollTop,
      scrollTopValue: scrollTop,
      isScrollingType: typeof isScrolling,
      isScrollingValue: isScrolling,
      resizeObserverType: typeof resizeObserver
    })

    // Validate each media item has valid object properties for WeakMap
    allMedia.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`🚨 Invalid media item at index ${index}:`, item)
      }
      if (!item.id || (typeof item.id !== 'string' && typeof item.id !== 'number')) {
        console.warn(`🚨 Invalid ID in media item at index ${index}:`, item.id)
      }
    })
  }

  // 🛡️ SafeItems: Filter out any invalid items that might cause WeakMap errors
  const safeItems = allMedia.filter((item, index) => {
    const isValid = item &&
                   typeof item === 'object' &&
                   item !== null &&
                   (item.id !== null && item.id !== undefined)

    if (!isValid && process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Filtering out invalid item at index ${index}:`, item)
    }

    return isValid
  })

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8">
      <Masonry
        items={safeItems}
        positioner={positioner}
        scrollTop={mounted && scrollTop != null ? scrollTop : 0}
        isScrolling={mounted && typeof isScrolling === 'boolean' ? isScrolling : false}
        height={windowHeight}
        overscanBy={dynamicOverscanBy}
        {...(resizeObserver ? { resizeObserver } : {})}
        render={MasonryCard}
      />

      {/* 로딩 완료 인디케이터 */}
      {safeItems.length > 0 && (
        <div className="text-center mt-8 py-4 text-gray-500 text-sm">
          총 {safeItems.length}개의 미디어 파일이 로드되었습니다
          <br />
          <span className="text-xs text-gray-400">
            {columnConfig.columnCount}열 그리드 · overscan: {dynamicOverscanBy} ·
            {isScrolling ? '스크롤 중' : '정적'} ·
            고급 가상화 활성화
          </span>
        </div>
      )}
    </div>
  )
})

// 🚀 Performance: Enhanced comparison for better memoization
const arePropsEqual = (prevProps: MasonryGalleryProps, nextProps: MasonryGalleryProps) => {
  // 빠른 참조 비교
  if (prevProps.models === nextProps.models && prevProps.loading === nextProps.loading) {
    return true
  }

  // 로딩 상태 변경 확인
  if (prevProps.loading !== nextProps.loading) {
    return false
  }

  // 배열 길이 확인 (빠른 차단)
  if (prevProps.models.length !== nextProps.models.length) {
    return false
  }

  // ID 기반 깊은 비교 (최소한의 비교로 성능 최적화)
  for (let i = 0; i < prevProps.models.length; i++) {
    if (prevProps.models[i]?.id !== nextProps.models[i]?.id) {
      return false
    }
  }

  return true
}

export default memo(MasonryGallery, arePropsEqual)
