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

  // Filtered media based on current page (with WeakMap safety)
  const allMedia = useMemo(() => {
    // Always process data, don't wait for mounted state
    const isModelPage = mounted && typeof window !== 'undefined' && window.location.pathname === '/model'
    const isVideoPage = mounted && typeof window !== 'undefined' && window.location.pathname === '/video'

    // 🛡️ Safe filtering: Remove null/undefined items first, then apply page filters
    const safeModels = models
      .filter(item => item && item.id) // null/undefined 항목 필터링
      .map(item => ({
        ...item,
        id: String(item.id), // 문자열로 확실히 변환
        name: item.name || item.fileName || `Media ${item.id}`,
        imageUrl: item.imageUrl || '',
        imageAlt: item.imageAlt || `Media: ${item.name || item.id}`,
        category: item.category || item.type || 'image',
        width: Number(item.width) || 400, // 기본 너비
        height: Number(item.height) || 300, // 기본 높이
        type: item.type || 'image'
      }))
      .filter(item => item.imageUrl && item.width > 0 && item.height > 0) // 유효한 데이터만

    let filteredMedia = safeModels
    if (isModelPage) {
      filteredMedia = safeModels.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filteredMedia = safeModels.filter(media => media.type === 'video')
    }

    return filteredMedia
  }, [models, mounted])

  // 🚀 Simplified Masonic hooks integration - avoid WeakMap issues completely  
  const { offset, width } = useContainerPosition(containerRef, [windowWidth, windowHeight])
  
  // 🛡️ Enhanced WeakMap-safe scroller with strict object validation
  const scrollerTarget = useMemo(() => {
    // Strict validation: Must be a valid DOM element or object for WeakMap
    const isValidWeakMapKey = (obj: any): obj is object => {
      return obj !== null &&
             obj !== undefined &&
             typeof obj === 'object' &&
             !Array.isArray(obj) &&
             (obj instanceof Element || obj instanceof Window || typeof obj.addEventListener === 'function')
    }

    // First try: validate offset object
    if (mounted && isValidWeakMapKey(offset)) {
      return offset
    }

    // Second try: validate containerRef.current
    if (containerRef.current && isValidWeakMapKey(containerRef.current)) {
      return containerRef.current
    }

    // Third try: ensure document.documentElement is valid
    if (typeof document !== 'undefined' && isValidWeakMapKey(document.documentElement)) {
      return document.documentElement
    }

    // Final fallback: create a minimal valid object for WeakMap
    // This ensures we never pass a primitive value to WeakMap
    return { __fallbackScrollTarget: true, scrollTop: 0, addEventListener: () => {}, removeEventListener: () => {} }
  }, [mounted, offset])

  // 🛡️ Safe scroller hook usage with additional error boundary
  let scrollTop = 0
  let isScrolling = false

  try {
    const scrollerResult = useScroller(scrollerTarget)
    scrollTop = typeof scrollerResult.scrollTop === 'number' ? scrollerResult.scrollTop : 0
    isScrolling = typeof scrollerResult.isScrolling === 'boolean' ? scrollerResult.isScrolling : false
  } catch (error) {
    // WeakMap error caught - log and use safe defaults
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 WeakMap error in useScroller caught and recovered:', error)
      console.warn('ScrollerTarget type:', typeof scrollerTarget, scrollerTarget)
    }
    scrollTop = 0
    isScrolling = false
  }

  // 스마트 컬럼 계산 - 상단에 4-5개 이미지가 잘 보이도록 최적화
  const columnConfig = useMemo(() => {
    const availableWidth = width > 0 ? width : windowWidth
    let columnCount = 2
    let columnWidth = 300

    // 데스크탑에서 4-5개 컬럼이 상단에 잘 보이도록 조정
    if (availableWidth >= 1920) {
      columnCount = 5 // 4K에서 5개
      columnWidth = Math.floor((availableWidth - 80) / 5) - 8
    } else if (availableWidth >= 1536) {
      columnCount = 5 // 큰 데스크탑에서 5개
      columnWidth = Math.floor((availableWidth - 80) / 5) - 8
    } else if (availableWidth >= 1280) {
      columnCount = 4 // 일반 데스크탑에서 4개
      columnWidth = Math.floor((availableWidth - 64) / 4) - 8
    } else if (availableWidth >= 1024) {
      columnCount = 4 // 작은 데스크탑에서도 4개 유지
      columnWidth = Math.floor((availableWidth - 64) / 4) - 6
    } else if (availableWidth >= 768) {
      columnCount = 3 // 태블릿에서 3개
      columnWidth = Math.floor((availableWidth - 48) / 3) - 6
    } else if (availableWidth >= 640) {
      columnCount = 2 // 큰 모바일에서 2개
      columnWidth = Math.floor((availableWidth - 32) / 2) - 6
    } else {
      columnCount = 2 // 작은 모바일에서 2개
      columnWidth = Math.floor((availableWidth - 24) / 2) - 4
    }

    return { columnCount, columnWidth }
  }, [width, windowWidth])

  // 🛡️ Enhanced WeakMap-safe positioner with validation
  let positioner: any = null

  try {
    positioner = usePositioner({
      width: width > 0 ? width : windowWidth,
      columnWidth: columnConfig.columnWidth,
      columnGutter: 4,
      rowGutter: 4
    }, [width, windowWidth, columnConfig.columnWidth])

    // Validate positioner is a valid object for WeakMap usage
    if (!positioner || typeof positioner !== 'object' || positioner === null) {
      throw new Error('Invalid positioner object returned')
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Positioner error caught, using fallback:', error)
    }

    // Create a minimal fallback positioner
    positioner = {
      __fallbackPositioner: true,
      getSize: () => ({ width: columnConfig.columnWidth, height: 200 }),
      items: [],
      range: () => ({ start: 0, end: 0 }),
      set: () => {},
      get: () => ({ width: columnConfig.columnWidth, height: 200, left: 0, top: 0 }),
      update: () => {},
      estimateHeight: () => 1000
    }
  }

  // ✅ DEBUGGING: Validate positioner for WeakMap compatibility
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Positioner debug:', {
      type: typeof positioner,
      isObject: typeof positioner === 'object',
      isNull: positioner === null,
      hasKeys: positioner ? Object.keys(positioner).length : 0,
      isFallback: positioner?.__fallbackPositioner || false
    })
  }

  // 🛡️ Enhanced WeakMap-safe resize observer
  let resizeObserver: any = null

  try {
    // Only use resize observer if positioner is valid and not a fallback
    if (positioner && !positioner.__fallbackPositioner) {
      resizeObserver = useResizeObserver(positioner)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 ResizeObserver error caught, using fallback:', error)
    }
    // Create a minimal fallback resize observer
    resizeObserver = {
      __fallbackResizeObserver: true,
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    }
  }

  // Dynamic overscanBy calculation based on screen size and performance
  const dynamicOverscanBy = useMemo(() => {
    // Higher initial overscan to ensure top items are rendered
    const baseOverscan = !mounted ? 15 : 8 // Higher initial value

    const screenMultiplier = windowHeight > 1000 ? 1.5 : 1
    const itemCountMultiplier = allMedia.length > 100 ? 1.2 : 1

    return Math.ceil(baseOverscan * screenMultiplier * itemCountMultiplier)
  }, [mounted, windowHeight, allMedia.length])

  const MasonryCard = useCallback(({ index, data, width }: { index: number, data: Media, width: number }) => {
    // 스마트 종횡비 감지 및 배치 시스템 (16:9 ~ 9:16)
    const aspectRatio = data.width / data.height

    const calculateHeight = () => {
      // 16:9 초광각 (1.78:1 이상)
      if (aspectRatio >= 1.78) {
        return Math.max(width * 0.4, width / aspectRatio) // 최소 높이 보장
      }
      // 4:3 가로 (1.33:1 이상)
      else if (aspectRatio >= 1.33) {
        return width / aspectRatio
      }
      // 정사각형 근처 (0.75:1 ~ 1.33:1)
      else if (aspectRatio >= 0.75) {
        return width / aspectRatio
      }
      // 3:4 세로 (0.75:1 ~ 0.56:1)
      else if (aspectRatio >= 0.56) {
        return Math.min(width * 1.8, width / aspectRatio) // 최대 높이 제한
      }
      // 9:16 초세로 (0.56:1 미만)
      else {
        return Math.min(width * 2.2, width / aspectRatio) // 더 큰 최대 높이
      }
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

  // 🛡️ SafeItems: Enhanced WeakMap protection with object wrapping
  const safeItems = allMedia
    .filter((item, index) => {
      const isValid = item &&
                     typeof item === 'object' &&
                     item !== null &&
                     (item.id !== null && item.id !== undefined)

      if (!isValid && process.env.NODE_ENV === 'development') {
        console.warn(`🚨 Filtering out invalid item at index ${index}:`, item)
      }

      return isValid
    })
    .map((item, index) => {
      // 🔒 CRITICAL: Ensure each item is a unique object reference for WeakMap
      // WeakMap requires object identity, not just object shape
      return {
        ...item,
        __weakMapSafe: true,
        __index: index,
        __timestamp: Date.now(),
        // Ensure id is always a valid object property
        id: String(item.id), // Convert to string to ensure consistency
      }
    })

  // 🛡️ Enhanced empty state handling - distinguish between loading and truly empty
  if (!safeItems || safeItems.length === 0) {
    // Check if we have processed all data but found no valid items
    const hasProcessedData = models && models.length > 0
    const isEmptyAfterFiltering = hasProcessedData && allMedia.length === 0
    const isReallyEmpty = !hasProcessedData || (hasProcessedData && allMedia.length === 0)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Different icons based on state */}
            <div className="text-6xl text-gray-300">
              {loading ? "⏳" : isEmptyAfterFiltering ? "🔍" : "📷"}
            </div>

            {/* Context-appropriate messages */}
            <div className="space-y-2">
              <div className="text-gray-600 text-lg font-medium">
                {loading ? "미디어 로딩 중..." :
                 isEmptyAfterFiltering ? "필터링된 결과가 없습니다" :
                 "아직 업로드된 미디어가 없습니다"}
              </div>

              <div className="text-gray-500 text-sm max-w-md">
                {loading ? "잠시만 기다려주세요..." :
                 isEmptyAfterFiltering ? "다른 카테고리를 확인해보거나 전체 갤러리를 방문해보세요." :
                 "관리자 페이지에서 이미지나 비디오를 업로드해보세요."}
              </div>
            </div>

            {/* Action buttons for empty states */}
            {!loading && isReallyEmpty && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  관리자 페이지로 이동
                </button>
                <div className="text-xs text-gray-400">
                  관리자 권한이 필요합니다
                </div>
              </div>
            )}

            {/* Filter-specific guidance */}
            {!loading && isEmptyAfterFiltering && (
              <div className="mt-6 space-x-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  전체 갤러리
                </button>
                <button
                  onClick={() => window.location.href = '/model'}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  모델 이미지
                </button>
                <button
                  onClick={() => window.location.href = '/video'}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  비디오
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8">
      {/* 🛡️ Enhanced WeakMap-safe Masonry rendering with error boundary */}
      {(() => {
        try {
          // Final validation before rendering Masonry
          const isValidMasonryProps = positioner &&
                                    typeof positioner === 'object' &&
                                    !positioner.__fallbackPositioner &&
                                    safeItems &&
                                    Array.isArray(safeItems)

          if (!isValidMasonryProps) {
            // Fallback to simple grid layout
            return (
              <div className="grid gap-4" style={{
                gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`
              }}>
                {safeItems.map((item, index) => (
                  <SafeModelCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    imageUrl={item.imageUrl}
                    originalUrl={item.originalUrl}
                    imageAlt={item.imageAlt}
                    category={item.category}
                    width={columnConfig.columnWidth}
                    height={columnConfig.columnWidth * 1.2} // Default aspect ratio
                    type={item.type}
                    duration={item.duration}
                    resolution={item.resolution}
                    isAdminMode={false}
                  />
                ))}
              </div>
            )
          }

          return (
            <Masonry
              items={safeItems}
              positioner={positioner}
              scrollTop={typeof scrollTop === 'number' ? scrollTop : 0}
              isScrolling={typeof isScrolling === 'boolean' ? isScrolling : false}
              height={windowHeight}
              overscanBy={dynamicOverscanBy}
              resizeObserver={resizeObserver}
              render={MasonryCard}
            />
          )
        } catch (error) {
          // Final error boundary - render simple grid
          if (process.env.NODE_ENV === 'development') {
            console.error('🚨 Masonry rendering error caught, falling back to simple grid:', error)
          }

          return (
            <div className="grid gap-4" style={{
              gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`
            }}>
              {safeItems.map((item, index) => (
                <SafeModelCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  imageUrl={item.imageUrl}
                  originalUrl={item.originalUrl}
                  imageAlt={item.imageAlt}
                  category={item.category}
                  width={columnConfig.columnWidth}
                  height={columnConfig.columnWidth * 1.2}
                  type={item.type}
                  duration={item.duration}
                  resolution={item.resolution}
                  isAdminMode={false}
                />
              ))}
            </div>
          )
        }
      })()}

      {/* 로딩 완료 인디케이터 */}
      {safeItems.length > 0 && (
        <div className="text-center mt-8 py-4 text-gray-500 text-sm">
          총 {safeItems.length}개의 미디어 파일이 로드되었습니다
          <br />
          <span className="text-xs text-gray-400">
            {columnConfig.columnCount}열 그리드 · overscan: {dynamicOverscanBy} ·
            {isScrolling ? '스크롤 중' : '정적'} ·
            {positioner?.__fallbackPositioner ? '단순 그리드 모드' : '고급 가상화 활성화'}
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
