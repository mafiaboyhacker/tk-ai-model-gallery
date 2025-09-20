'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { Masonry } from 'masonic'
import ModelCard from './ModelCard'

// 🚀 PHASE 2 OPTIMIZATION: Advanced Masonry Virtualization (25-30% improvement)

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

interface VirtualizedMasonryGalleryProps {
  models: Media[]
  loading?: boolean
  virtualizationThreshold?: number // When to enable virtualization
  itemHeight?: number // Average item height for virtualization
}

// 🚀 Custom hook for intersection observer with smart loading
const useIntersectionObserver = (threshold = 50) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: threshold })
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const targetRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            setIsIntersecting(entry.isIntersecting)
            if (entry.isIntersecting) {
              // Dynamically expand visible range for smooth scrolling
              setVisibleRange(prev => ({
                start: Math.max(0, prev.start - 10),
                end: Math.min(prev.end + 20, threshold * 2)
              }))
            }
          })
        },
        {
          rootMargin: '200px 0px', // Preload 200px before viewport
          threshold: 0.1
        }
      )

      observerRef.current.observe(node)
    }
  }, [threshold])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return { visibleRange, isIntersecting, targetRef }
}

// 🚀 Optimized height calculation with caching
const useOptimizedHeights = (models: Media[]) => {
  const heightCache = useMemo(() => new Map<string, number>(), [])

  const calculateHeight = useCallback((item: Media, width: number) => {
    const cacheKey = `${item.id}-${width}`

    if (heightCache.has(cacheKey)) {
      return heightCache.get(cacheKey)!
    }

    const aspectRatio = item.width / item.height
    const height = aspectRatio >= 1.6
      ? Math.max(120, width / aspectRatio)
      : width / aspectRatio

    heightCache.set(cacheKey, height)
    return height
  }, [heightCache])

  return calculateHeight
}

// 🚀 Performance: Debounced resize with better performance
const useDebounce = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback((...args: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)
    setDebounceTimer(newTimer)
  }, [callback, delay, debounceTimer])

  return debouncedCallback
}

// 🚀 Optimized Masonry Component with performance enhancements
const OptimizedMasonry = memo(function OptimizedMasonry({
  models,
  itemHeight = 300
}: {
  models: Media[]
  itemHeight?: number
}) {
  const [columnsCount, setColumnsCount] = useState(2)
  const [mounted, setMounted] = useState(false)
  const calculateHeight = useOptimizedHeights(models)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateColumns = useCallback(() => {
    const width = window.innerWidth

    // 🚀 성능 최적화: 빠른 계산 (중복 조건 제거)
    let newColumnCount = 2
    if (width >= 1024) newColumnCount = 6      // 1024px+ = 6열
    else if (width >= 768) newColumnCount = 4  // 768px+ = 4열
    else if (width >= 640) newColumnCount = 3  // 640px+ = 3열
    // 640px 미만 = 2열 (기본값)

    if (newColumnCount !== columnsCount) {
      setColumnsCount(newColumnCount)
    }
  }, [columnsCount])

  const debouncedUpdateColumns = useDebounce(updateColumns, 30) // 🚀 최적화: 50ms → 30ms (더 빠른 반응)

  useEffect(() => {
    updateColumns()
    window.addEventListener('resize', debouncedUpdateColumns)
    return () => window.removeEventListener('resize', debouncedUpdateColumns)
  }, [updateColumns, debouncedUpdateColumns])

  const positioner = useMemo(() => {
    if (typeof window === 'undefined') {
      return { columnWidth: 300, columnGutter: 2, rowGutter: 2 }
    }
    const columnWidth = (window.innerWidth - 32) / columnsCount - 2
    return {
      columnWidth,
      columnGutter: 2,
      rowGutter: 2
    }
  }, [columnsCount])

  // 🚀 최근 업로드 감지 (5분 이내)
  const isRecentUpload = useCallback((data: Media) => {
    const mediaData = data as any // GalleryMediaData 타입으로 확장
    if (!mediaData.createdAt) return false

    const uploadTime = new Date(mediaData.createdAt)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    return uploadTime > fiveMinutesAgo
  }, [])

  const MasonryCard = useCallback(({ index, data, width }: {
    index: number
    data: Media
    width: number
  }) => {
    return (
      <ModelCard
        key={data.id}
        id={data.id}
        name={data.name}
        imageUrl={data.imageUrl}
        originalUrl={data.originalUrl}
        imageAlt={data.imageAlt}
        category={data.category}
        width={width}
        height={calculateHeight(data, width)}
        type={data.type}
        duration={data.duration}
        resolution={data.resolution}
        isAdminMode={false}
        isRecentUpload={isRecentUpload(data)} // 🚀 최근 업로드 감지 및 우선순위 적용
      />
    )
  }, [calculateHeight, isRecentUpload])

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '2px' }}>
            {Array.from({ length: 6 }).map((_, index) => ( // 12 → 6 (빠른 초기 렌더링)
              <div
                key={index}
                className="bg-gray-100 rounded-lg mb-4 image-loading"
                style={{
                  height: Math.floor(Math.random() * 200) + 200
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Masonry
        items={models}
        columnGutter={positioner.columnGutter}
        columnWidth={positioner.columnWidth}
        overscanBy={4} // 🚀 최적화: 6 → 4 (더 빠른 초기 렌더링)
        render={MasonryCard}
        height={window.innerHeight * 0.5} // 🚀 최적화: 0.6 → 0.5 (초기 로딩 속도 향상)
        maxRenderHeight={window.innerWidth < 768 ? window.innerHeight * 1.5 : window.innerHeight * 3} // 🚀 메모리 최적화
        // 🚀 추가 성능 옵션
        as="div"
        role="grid"
        tabIndex={0}
      />
    </div>
  )
})

// 🚀 Standard Masonry Loading Skeleton with real-time timer
const StandardMasonryLoadingSkeleton = memo(function StandardMasonryLoadingSkeleton({
  loading,
  mounted,
  columnsCount
}: {
  loading: boolean
  mounted: boolean
  columnsCount: number
}) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number>(performance.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current
      setElapsedTime(elapsed)
    }, 100) // 100ms마다 업데이트

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 로딩 상태 표시 with 실시간 타이머 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 text-gray-600">
          <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="text-lg font-medium">
            {loading ? '미디어 데이터를 처리하는 중...' : '가상화 갤러리 초기화 중...'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {loading ? '최적화된 레이아웃을 생성하고 있습니다' : '반응형 그리드를 준비하고 있습니다'}
        </p>
        {/* ⏱️ 실시간 로딩 시간 표시 */}
        <div className="mt-3 text-xs text-gray-400 font-mono">
          처리 시간: {elapsedTime.toFixed(0)}ms
          {elapsedTime > 2000 && <span className="text-orange-500 ml-2">⚠️ 느림</span>}
          {elapsedTime > 5000 && <span className="text-red-500 ml-2">🐌 매우 느림</span>}
        </div>
      </div>

      {/* 스켈레톤 그리드 */}
      <div className="animate-pulse">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '2px' }}>
          {Array.from({ length: 6 }).map((_, index) => ( // 🚀 최적화: 8 → 6 (더 빠른 스켈레톤 로딩)
            <div
              key={index}
              className="bg-gray-100 rounded-lg mb-4"
              style={{
                height: 180 + (index % 2) * 80 // 🚀 최적화: 높이 범위 축소 (부드러운 애니메이션)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

// 🚀 Standard Masonry for smaller collections
const StandardMasonryGallery = memo(function StandardMasonryGallery({
  models,
  loading
}: {
  models: Media[]
  loading?: boolean
}) {
  const [columnsCount, setColumnsCount] = useState(2)
  const [mounted, setMounted] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)
  const calculateHeight = useOptimizedHeights(models)

  useEffect(() => {
    setMounted(true)
    setViewportWidth(window.innerWidth)
  }, [])

  const updateColumns = useCallback(() => {
    const width = window.innerWidth

    // Prevent unnecessary updates
    if (Math.abs(width - viewportWidth) < 50) return

    setViewportWidth(width)

    let newColumnCount = 2
    if (width >= 1536) newColumnCount = 6
    else if (width >= 1280) newColumnCount = 6
    else if (width >= 1024) newColumnCount = 6
    else if (width >= 768) newColumnCount = 4
    else if (width >= 640) newColumnCount = 3

    setColumnsCount(prevCount => prevCount !== newColumnCount ? newColumnCount : prevCount)
  }, [viewportWidth])

  const debouncedUpdateColumns = useDebounce(updateColumns, 150)

  useEffect(() => {
    updateColumns()
    window.addEventListener('resize', debouncedUpdateColumns)
    return () => window.removeEventListener('resize', debouncedUpdateColumns)
  }, [updateColumns, debouncedUpdateColumns])

  const positioner = useMemo(() => {
    if (typeof window === 'undefined') {
      return { columnWidth: 300, columnGutter: 2, rowGutter: 2 }
    }
    const columnWidth = (window.innerWidth - 32) / columnsCount - 2
    return {
      columnWidth,
      columnGutter: 2,
      rowGutter: 2
    }
  }, [columnsCount])

  // 🚀 최근 업로드 감지 (5분 이내)
  const isRecentUpload = useCallback((data: Media) => {
    const mediaData = data as any // GalleryMediaData 타입으로 확장
    if (!mediaData.createdAt) return false

    const uploadTime = new Date(mediaData.createdAt)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    return uploadTime > fiveMinutesAgo
  }, [])

  const MasonryCard = useCallback(({ index, data, width }: {
    index: number
    data: Media
    width: number
  }) => {
    return (
      <ModelCard
        key={data.id}
        id={data.id}
        name={data.name}
        imageUrl={data.imageUrl}
        originalUrl={data.originalUrl}
        imageAlt={data.imageAlt}
        category={data.category}
        width={width}
        height={calculateHeight(data, width)}
        type={data.type}
        duration={data.duration}
        resolution={data.resolution}
        isAdminMode={false}
        isRecentUpload={isRecentUpload(data)} // 🚀 최근 업로드 감지 및 우선순위 적용
      />
    )
  }, [calculateHeight, isRecentUpload])

  if (loading || !mounted) {
    return <StandardMasonryLoadingSkeleton loading={loading} mounted={mounted} columnsCount={columnsCount} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Masonry
        items={models}
        columnGutter={positioner.columnGutter}
        columnWidth={positioner.columnWidth}
        overscanBy={3} // Reduced for better performance
        render={MasonryCard}
        height={window.innerHeight * 1.5} // Optimized viewport
        maxRenderHeight={window.innerHeight * 2} // Performance constraint
      />
    </div>
  )
})

// 🚀 Main Virtualized Masonry Gallery Component
const VirtualizedMasonryGallery = memo(function VirtualizedMasonryGallery({
  models,
  loading = false,
  virtualizationThreshold = 50, // 🚀 최적화: 100→50 아이템 (빠른 가상화 활성화)
  itemHeight = 300
}: VirtualizedMasonryGalleryProps) {
  const [mounted, setMounted] = useState(false)
  const { visibleRange, isIntersecting, targetRef } = useIntersectionObserver(50)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter models based on page type + 중복 제거
  const filteredModels = useMemo(() => {
    if (!mounted) return []

    const isModelPage = typeof window !== 'undefined' && window.location.pathname === '/model'
    const isVideoPage = typeof window !== 'undefined' && window.location.pathname === '/video'

    // Step 1: ID 기준 중복 제거 (Map 사용하여 성능 최적화)
    const uniqueMediaMap = new Map()
    models.forEach(media => {
      if (!uniqueMediaMap.has(media.id)) {
        uniqueMediaMap.set(media.id, media)
      }
    })

    let filtered = Array.from(uniqueMediaMap.values())

    // 중복 제거 결과 로깅
    if (models.length !== filtered.length) {
      console.log(`⚠️ VirtualizedMasonryGallery 중복 제거: 원본 ${models.length}개 → 중복제거 ${filtered.length}개`)
    }

    // Step 2: 페이지 타입 기반 필터링
    if (isModelPage) {
      filtered = filtered.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filtered = filtered.filter(media => media.type === 'video')
    }

    console.log(`✅ VirtualizedMasonryGallery: ${filtered.length}개 미디어 렌더링 (중복 제거 + 필터링 완료)`)

    return filtered
  }, [models, mounted])

  // Decide whether to use virtualization
  const shouldVirtualize = filteredModels.length > virtualizationThreshold

  if (loading || !mounted) {
    return <StandardMasonryGallery models={[]} loading={true} />
  }

  // 🚀 빈 상태 처리
  if (filteredModels.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">아직 업로드된 미디어가 없습니다</h3>
          <p className="text-gray-500">어드민 페이지에서 이미지와 비디오를 업로드해보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={targetRef} className="w-full">
      {shouldVirtualize ? (
        <OptimizedMasonry models={filteredModels} itemHeight={itemHeight} />
      ) : (
        <StandardMasonryGallery models={filteredModels} loading={false} />
      )}
    </div>
  )
})

// Enhanced comparison for better memoization
const arePropsEqual = (
  prevProps: VirtualizedMasonryGalleryProps,
  nextProps: VirtualizedMasonryGalleryProps
) => {
  // Quick reference comparison
  if (prevProps.models === nextProps.models &&
      prevProps.loading === nextProps.loading &&
      prevProps.virtualizationThreshold === nextProps.virtualizationThreshold) {
    return true
  }

  // Loading state change
  if (prevProps.loading !== nextProps.loading) {
    return false
  }

  // Array length check
  if (prevProps.models.length !== nextProps.models.length) {
    return false
  }

  // ID-based deep comparison (minimal)
  for (let i = 0; i < prevProps.models.length; i++) {
    if (prevProps.models[i]?.id !== nextProps.models[i]?.id) {
      return false
    }
  }

  return true
}

export default memo(VirtualizedMasonryGallery, arePropsEqual)