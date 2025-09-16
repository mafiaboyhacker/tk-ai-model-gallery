'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Masonry from 'react-responsive-masonry'
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
}

interface MasonryGalleryProps {
  models: Media[]
  loading?: boolean
}

// 🚀 Performance: Memoized component to prevent unnecessary re-renders
function MasonryGallery({ models, loading = false }: MasonryGalleryProps) {
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

  // 🚀 Performance: Optimized responsive column calculation
  const updateColumns = useCallback(() => {
    const width = window.innerWidth
    let newColumnCount = 2 // default

    if (width >= 1536) newColumnCount = 6        // 2xl
    else if (width >= 1280) newColumnCount = 5   // xl
    else if (width >= 1024) newColumnCount = 4   // lg
    else if (width >= 768) newColumnCount = 3    // md
    else if (width >= 640) newColumnCount = 2    // sm

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <Masonry columnsCount={columnsCount} gutter="2px">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg mb-4"
                style={{
                  height: Math.floor(Math.random() * 200) + 200
                }}
              />
            ))}
          </Masonry>
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
        columnsCount={columnsCount}
        gutter="2px"
        className="masonry-grid"
      >
        {allMedia.map((media) => (
          <div key={media.id}>
            <ModelCard
              id={media.id}
              name={media.name}
              imageUrl={media.imageUrl}
              originalUrl={media.originalUrl}  // 원본 URL 전달
              imageAlt={media.imageAlt}
              category={media.category}
              width={media.width}
              height={media.height}
              type={media.type}
              duration={media.duration}
              resolution={media.resolution}
              isAdminMode={false}  // 메인 페이지에서는 비디오 자동재생
            />
          </div>
        ))}
      </Masonry>
    </div>
  )
}

// 🚀 Performance: Export memoized component with shallow comparison
export default memo(MasonryGallery, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.models.length === nextProps.models.length &&
    prevProps.models.every((model, index) => model.id === nextProps.models[index]?.id)
  )
})