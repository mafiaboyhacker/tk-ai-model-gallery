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

interface Media {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string
  imageAlt: string
  category: string
  width: number
  height: number
  type?: 'image' | 'video'
  duration?: number
  resolution?: string
  colSpan?: number
}

interface MasonryGalleryProps {
  models: Media[]
  loading?: boolean
}

// 🚀 Client-only Masonic implementation - SSR safe with error boundary
const ClientOnlyMasonryGallery = memo(function ClientOnlyMasonryGallery({ models, loading = false }: MasonryGalleryProps) {
  const [hasError, setHasError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)
  const [windowHeight, setWindowHeight] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)

  // 🛡️ SSR Safe: Only access window after component mount
  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return models

    const isModelPage = window.location.pathname === '/model'
    const isVideoPage = window.location.pathname === '/video'

    let filteredMedia = models
    if (isModelPage) {
      filteredMedia = models.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filteredMedia = models.filter(media => media.type === 'video')
    }

    return filteredMedia
  }, [models])

  // 🚀 Masonic hooks integration
  const { offset, width } = useContainerPosition(containerRef, [windowWidth, windowHeight])

  // Error boundary for WeakMap issues
  const [hasWeakMapError, setHasWeakMapError] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('weak map key') || error.message.includes('WeakMap')) {
        console.error('🚨 WeakMap error detected:', error)
        setHasWeakMapError(true)
        setTimeout(() => setHasWeakMapError(false), 1000)
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // 🛡️ WeakMap safety: Ensure offset is a valid object
  const safeOffset = useMemo(() => {
    if (!offset || typeof offset !== 'object' || offset === null || Array.isArray(offset)) {
      return {
        top: 0,
        left: 0,
        element: containerRef.current || (typeof document !== 'undefined' ? document.documentElement : null),
        width: width > 0 ? width : windowWidth,
        height: windowHeight
      }
    }
    return offset
  }, [offset, width, windowWidth, windowHeight])

  // 🛡️ Safe scroller to prevent hydration mismatch
  const { scrollTop, isScrolling } = useScroller(mounted ? safeOffset : { top: 0, left: 0, element: null, width: 1200, height: 800 })

  // Dynamic column calculation based on width
  const columnConfig = useMemo(() => {
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

  // 🛡️ Safe positioner configuration to prevent SSR/hydration mismatch
  const positionerConfig = useMemo(() => ({
    width: mounted ? (width > 0 ? width : windowWidth) : 1200, // Safe fallback for SSR
    columnWidth: columnConfig.columnWidth,
    columnGutter: 4,
    rowGutter: 4
  }), [mounted, width, windowWidth, columnConfig.columnWidth])

  const positioner = usePositioner(positionerConfig, [mounted, width, windowWidth, columnConfig.columnWidth])

  // 🚀 Resize observer for dynamic height changes - SSR safe
  // Always call the hook, but with a safe fallback positioner
  const resizeObserver = useResizeObserver(positioner)

  // Dynamic overscanBy calculation
  const dynamicOverscanBy = useMemo(() => {
    const baseOverscan = 8
    const screenMultiplier = windowHeight > 1000 ? 1.5 : 1
    const itemCountMultiplier = allMedia.length > 100 ? 1.2 : 1

    return Math.ceil(baseOverscan * screenMultiplier * itemCountMultiplier)
  }, [windowHeight, allMedia.length])

  const MasonryCard = useCallback(({ index, data, width }: { index: number, data: Media, width: number }) => {
    const aspectRatio = data.width / data.height
    const calculateHeight = () => {
      if (aspectRatio >= 1.6) {
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

  // Enhanced skeleton loading
  const SkeletonLoader = useMemo(() => {
    const aspectRatios = [16/9, 9/16, 4/3, 3/4, 2/1, 1/1]
    const containerWidth = windowWidth || 1200
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
          {index % 3 === 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          )}
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
  }, [windowWidth, columnConfig.columnCount])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`, gap: '2px' }}>
          {SkeletonLoader}
        </div>
      </div>
    )
  }

  if (hasWeakMapError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <div className="text-gray-500 text-sm">갤러리 복구 중...</div>
          </div>
        </div>
      </div>
    )
  }

  // 🛡️ SafeItems: Enhanced WeakMap protection with comprehensive validation
  const safeItems = allMedia
    .filter((item, index) => {
      // Comprehensive WeakMap compatibility validation
      const isValidObject = item &&
                           typeof item === 'object' &&
                           item !== null &&
                           !Array.isArray(item)

      // 🛡️ Relaxed ID validation - allow any non-empty ID
      const hasValidId = item?.id !== null &&
                        item?.id !== undefined &&
                        String(item.id).length > 0

      // 🛡️ Allow all items regardless of dimensions - we'll provide defaults
      const hasValidDimensions = true // Always true, we provide fallback dimensions

      const isValid = isValidObject && hasValidId && hasValidDimensions

      if (!isValid) {
        console.warn(`🚨 Filtering out invalid item at index ${index}:`, {
          item,
          isValidObject,
          hasValidId,
          hasValidDimensions,
          id: item?.id,
          type: typeof item,
        })
      }

      return isValid
    })
    .map((item, index) => {
      // Create a completely new object to ensure WeakMap compatibility
      const safeItem = {
        id: String(item.id), // Ensure string ID
        name: String(item.name || `Media ${item.id}`),
        imageUrl: String(item.imageUrl || ''),
        originalUrl: String(item.originalUrl || ''),
        imageAlt: String(item.imageAlt || `Media: ${item.name}`),
        category: String(item.category || 'media'),
        width: Number(item.width) || 300, // Default width if not provided
        height: Number(item.height) || 300, // Default height if not provided
        type: item.type || 'image',
        duration: item.duration,
        resolution: item.resolution,
        // WeakMap safety markers
        __weakMapSafe: true,
        __index: index,
        __timestamp: Date.now(),
        __validated: true,
      }

      // Final validation - ensure the object can be used as WeakMap key
      try {
        const testWeakMap = new WeakMap()
        testWeakMap.set(safeItem, 'test')
        return safeItem
      } catch (error) {
        console.error(`🚨 Object cannot be used as WeakMap key:`, safeItem, error)
        return null
      }
    })
    .filter(item => item !== null) // Remove any objects that failed WeakMap test

  // 🛡️ SSR Protection: Don't render Masonry during SSR
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`, gap: '2px' }}>
          {SkeletonLoader}
        </div>
      </div>
    )
  }

  // 🛡️ Empty Data Protection: Don't render Masonry with empty data
  if (!safeItems || safeItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">데이터를 불러오는 중입니다</h3>
            <p className="text-gray-500">
              잠시만 기다려주세요
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 🛡️ Error boundary for Masonry rendering
  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-gray-400 mb-4 text-4xl">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">갤러리 로드 오류</h3>
            <p className="text-gray-500 mb-4">갤러리를 불러오는 중 문제가 발생했습니다.</p>
            <button 
              onClick={() => {
                setHasError(false)
                window.location.reload()
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderMasonry = () => {
    try {
      return (
        <Masonry
          items={safeItems}
          positioner={positioner}
          scrollTop={typeof scrollTop === 'number' ? Math.max(0, scrollTop) : 0}
          isScrolling={typeof isScrolling === 'boolean' ? isScrolling : false}
          height={Math.max(400, windowHeight)}
          overscanBy={Math.max(1, Math.min(20, dynamicOverscanBy))}
          resizeObserver={resizeObserver}
          render={MasonryCard}
        />
      )
    } catch (error) {
      console.error('🚨 Masonry rendering error:', error)
      setHasError(true)
      return null
    }
  }

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8">
      {mounted && positioner && safeItems.length > 0 ? (
        <div className="masonry-wrapper">
          {renderMasonry()}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnConfig.columnCount}, 1fr)`, gap: '2px' }}>
          {safeItems.length === 0 ? (
            <div className="col-span-full flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📷</div>
                <div className="text-gray-500">미디어가 없습니다</div>
              </div>
            </div>
          ) : (
            SkeletonLoader
          )}
        </div>
      )}

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

export default ClientOnlyMasonryGallery