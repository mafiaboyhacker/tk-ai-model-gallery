'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Masonry } from 'masonic'
import SafeModelCard from './SafeModelCard'
import { arrangeWithPriority, optimizePriorityLayout } from '@/utils/priorityArrange'
import type { Media } from '@/types'

interface PriorityGalleryProps {
  models: Media[]
  loading?: boolean
  onPriorityLoaded?: () => void
}

/**
 * 🎯 우선 갤러리 컴포넌트
 * - 상단 6개 즉시 렌더링
 * - 나머지는 순차 페이드인
 * - Chrome 안정성 보장
 */
const PriorityGallery = memo(function PriorityGallery({
  models,
  loading = false,
  onPriorityLoaded
}: PriorityGalleryProps) {
  const [columnsCount, setColumnsCount] = useState(2)
  const [mounted, setMounted] = useState(false)
  const [remainingVisible, setRemainingVisible] = useState(0)
  const [priorityLoaded, setPriorityLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 우선 배치 적용
  const { priority, remaining } = useMemo(() => {
    if (!mounted || models.length === 0) {
      return { priority: [], remaining: [] }
    }

    // 현재 페이지 필터링
    const isModelPage = typeof window !== 'undefined' && window.location.pathname === '/model'
    const isVideoPage = typeof window !== 'undefined' && window.location.pathname === '/video'

    let filteredMedia = models
    if (isModelPage) {
      filteredMedia = models.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filteredMedia = models.filter(media => media.type === 'video')
    }

    return arrangeWithPriority(filteredMedia)
  }, [models, mounted])

  // 반응형 컬럼 계산
  const updateColumns = useCallback(() => {
    const width = window.innerWidth
    let newColumnCount = 2

    if (width >= 1536) newColumnCount = 6
    else if (width >= 1280) newColumnCount = 6
    else if (width >= 1024) newColumnCount = 6
    else if (width >= 768) newColumnCount = 4
    else if (width >= 640) newColumnCount = 3

    setColumnsCount(prevCount => prevCount !== newColumnCount ? newColumnCount : prevCount)
  }, [])

  useEffect(() => {
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [updateColumns])

  // 상단 6개 로드 완료 감지
  useEffect(() => {
    if (priority.length > 0 && !priorityLoaded) {
      // 상단 우선 아이템들의 로딩 상태 확인
      setTimeout(() => {
        setPriorityLoaded(true)
        onPriorityLoaded?.()
      }, 500) // 우선 아이템들이 로드될 시간
    }
  }, [priority.length, priorityLoaded, onPriorityLoaded])

  // 나머지 아이템들 순차 표시
  useEffect(() => {
    if (priorityLoaded && remaining.length > 0) {
      const interval = setInterval(() => {
        setRemainingVisible(prev => {
          const next = prev + 3 // 3개씩 추가
          if (next >= remaining.length) {
            clearInterval(interval)
            return remaining.length
          }
          return next
        })
      }, 100) // 100ms 간격

      return () => clearInterval(interval)
    }
  }, [priorityLoaded, remaining.length])

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

  // 최적화된 우선 아이템들
  const optimizedPriority = useMemo(() => {
    return optimizePriorityLayout(priority, positioner.columnWidth)
  }, [priority, positioner.columnWidth])

  // 현재 표시할 전체 아이템들
  const visibleItems = useMemo(() => {
    const visibleRemaining = remaining.slice(0, remainingVisible)
    return [...optimizedPriority, ...visibleRemaining]
  }, [optimizedPriority, remaining, remainingVisible])

  const MasonryCard = useCallback(({ index, data, width }: {
    index: number,
    data: Media & { calculatedHeight?: number, isPriority?: boolean },
    width: number
  }) => {
    // 🎨 미드저니 스타일: 원본 비율 유지 (비율 강제 변경 안함)
    const height = (() => {
      if (data.width && data.height) {
        // 원본 aspect ratio 그대로 유지
        return width / (data.width / data.height)
      }
      // 메타데이터 없는 경우 기본 높이
      return width * 1.2
    })()

    return (
      <div
        className={`transition-all duration-300 ease-out ${
          data.isPriority ? 'opacity-100' : 'opacity-100'
        }`}
        style={{
          transitionDelay: data.isPriority ? '0ms' : `${(index - 6) * 50}ms`
        }}
      >
        <SafeModelCard
          key={data.id}
          id={data.id}
          name={data.name}
          imageUrl={data.imageUrl}
          originalUrl={data.originalUrl}
          imageAlt={data.imageAlt}
          category={data.category}
          width={width}
          height={height}
          type={data.type}
          duration={data.duration}
          resolution={data.resolution}
          isAdminMode={false}
        />
      </div>
    )
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          갤러리를 준비하고 있습니다...
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      </div>
    )
  }

  if (visibleItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          표시할 미디어가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Masonry
        key={`masonry-${visibleItems.length}`}
        items={visibleItems}
        columnGutter={positioner.columnGutter}
        columnWidth={positioner.columnWidth}
        overscanBy={2}
        render={MasonryCard}
      />

      {/* 로딩 상태 표시 */}
      {remainingVisible < remaining.length && (
        <div className="text-center mt-8">
          <div className="text-sm text-gray-500">
            더 많은 콘텐츠를 불러오는 중... ({remainingVisible}/{remaining.length})
          </div>
        </div>
      )}
    </div>
  )
})

export default PriorityGallery