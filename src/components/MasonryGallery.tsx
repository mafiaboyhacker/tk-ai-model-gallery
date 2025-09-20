'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Masonry } from 'masonic'
import ModelCard from './ModelCard'
// import { useImageStore } from '@/store/imageStore' // 더 이상 사용하지 않음

// 🚀 Performance: Custom debounce hook
const useDebounce = (callback: Function, delay: number) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);

  return debouncedCallback;
};

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

// 🚀 Performance: Memoized component to prevent unnecessary re-renders
const MasonryGallery = memo(function MasonryGallery({ models, loading = false }: MasonryGalleryProps) {
  const [columnsCount, setColumnsCount] = useState(2)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  // props로 받은 models 사용 (store 직접 호출 제거)
  const allMedia = useMemo(() => {
    if (!mounted) {
      console.log('메인 갤러리: Not mounted yet, showing empty')
      return []
    }

    // props로 받은 models 사용
    console.log('메인 갤러리: Using props models -', models.length, 'items')

    // 현재 페이지에 따라 미디어 타입 필터링
    const isModelPage = typeof window !== 'undefined' && window.location.pathname === '/model'
    const isVideoPage = typeof window !== 'undefined' && window.location.pathname === '/video'

    let filteredMedia = models
    if (isModelPage) {
      filteredMedia = models.filter(media => media.type === 'image')
    } else if (isVideoPage) {
      filteredMedia = models.filter(media => media.type === 'video')
    }

    console.log('메인 갤러리: Filtered to', filteredMedia.length, 'media items')

    // models는 이미 Media 형태로 변환되어 전달됨
    return filteredMedia
  }, [models, mounted])

  // Masonic cache key to handle array mutations
  const masonryKey = useMemo(() => {
    return `masonry-${allMedia.length}-${allMedia.map(item => item.id).join('-').slice(0, 50)}`
  }, [allMedia])

  // 🚀 Performance: Optimized responsive column calculation
  const updateColumns = useCallback(() => {
    const width = window.innerWidth
    let newColumnCount = 2 // default

    if (width >= 1536) newColumnCount = 6        // 2xl (초대형 6열)
    else if (width >= 1280) newColumnCount = 6   // xl (6열)
    else if (width >= 1024) newColumnCount = 6   // lg (데스크탑 6열)
    else if (width >= 768) newColumnCount = 4    // md (4열)
    else if (width >= 640) newColumnCount = 3    // sm (3열)

    // Only update if changed to prevent unnecessary re-renders
    setColumnsCount(prevCount => prevCount !== newColumnCount ? newColumnCount : prevCount)
  }, [])

  // 🚀 Performance: Debounced resize handler
  const debouncedUpdateColumns = useDebounce(updateColumns, 150)

  useEffect(() => {
    updateColumns() // 초기 실행
    window.addEventListener('resize', debouncedUpdateColumns)
    return () => {
      window.removeEventListener('resize', debouncedUpdateColumns)
    }
  }, [updateColumns, debouncedUpdateColumns])

  const positioner = useMemo(() => {
    if (typeof window === 'undefined') {
      return { columnWidth: 300, columnGutter: 2, rowGutter: 2 }
    }
    const columnWidth = (window.innerWidth - 32) / columnsCount - 2; // 32px for padding, 2px gap
    return {
      columnWidth,
      columnGutter: 2,
      rowGutter: 2
    }
  }, [columnsCount])

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
      <ModelCard
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '2px' }}>
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg mb-4"
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

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading gallery...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Masonry
        key={masonryKey}
        items={allMedia}
        columnGutter={positioner.columnGutter}
        columnWidth={positioner.columnWidth}
        overscanBy={2}
        render={MasonryCard}
      />
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