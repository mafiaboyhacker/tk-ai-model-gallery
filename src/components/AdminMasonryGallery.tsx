'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Masonry from 'react-responsive-masonry'
import AdminModelCard from './AdminModelCard'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

interface Model {
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

interface AdminMasonryGalleryProps {
  models: Model[]
  loading?: boolean
  onNameUpdate?: (id: string, newName: string) => Promise<void>
}

export default function AdminMasonryGallery({ models, loading = false, onNameUpdate }: AdminMasonryGalleryProps) {
  const [columnsCount, setColumnsCount] = useState(2)
  const [mounted, setMounted] = useState(false)
  const { removeMedia, usingSupabase } = useEnvironmentStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 미디어 삭제 핸들러
  const handleDeleteMedia = useCallback(async (mediaId: string) => {
    try {
      const storageType = usingSupabase ? 'Supabase' : 'IndexedDB'
      console.log(`🗑️ ${storageType}를 통한 미디어 삭제 중:`, mediaId)
      await removeMedia(mediaId)
      console.log(`✅ ${storageType} 미디어 삭제 완료:`, mediaId)
    } catch (error) {
      console.error('❌ 미디어 삭제 실패:', error)
    }
  }, [removeMedia, usingSupabase])

  // props로 받은 models 데이터만 사용 (중복 제거)
  const allMedia = useMemo(() => {
    if (!mounted) {
      console.log('Admin: Not mounted yet, showing demo models only')
      return models
    }

    console.log('Admin: Showing', models.length, 'total models (no duplicates)')
    return models
  }, [models, mounted])

  // 반응형 컬럼 설정 (Midjourney 스타일) - 디바운스 최적화
  const updateColumns = useCallback(() => {
    const width = window.innerWidth
    if (width >= 1536) setColumnsCount(6)        // 2xl
    else if (width >= 1280) setColumnsCount(5)   // xl  
    else if (width >= 1024) setColumnsCount(4)   // lg
    else if (width >= 768) setColumnsCount(3)    // md
    else if (width >= 640) setColumnsCount(2)    // sm
    else setColumnsCount(2)                      // mobile
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const debouncedUpdateColumns = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateColumns, 100)
    }

    updateColumns() // 초기 실행
    window.addEventListener('resize', debouncedUpdateColumns)
    return () => {
      window.removeEventListener('resize', debouncedUpdateColumns)
      clearTimeout(timeoutId)
    }
  }, [updateColumns])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <Masonry columnsCount={columnsCount} gutter="2px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-gray-200 rounded-lg mb-4" 
                style={{ height: Math.random() * 200 + 200 }}
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
      {/* Gallery Statistics */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="bg-blue-100 px-3 py-1 rounded-full">
          <strong>Total:</strong> {allMedia.length} files
        </div>
        <div className="bg-green-100 px-3 py-1 rounded-full">
          <strong>Images:</strong> {allMedia.filter(m => m.type !== 'video').length} files
        </div>
        <div className="bg-purple-100 px-3 py-1 rounded-full">
          <strong>Videos:</strong> {allMedia.filter(m => m.type === 'video').length} files
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
          <strong>Status:</strong> Ready
        </div>
      </div>

      {allMedia.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No media in gallery</p>
          <p className="text-sm mt-2">Upload some images or videos to get started</p>
        </div>
      ) : (
        <Masonry columnsCount={columnsCount} gutter="2px">
          {allMedia.map((model) => (
            <AdminModelCard
              key={model.id}
              id={model.id}
              name={model.name}
              imageUrl={model.imageUrl}
              originalUrl={model.originalUrl}
              imageAlt={model.imageAlt}
              category={model.category}
              width={model.width}
              height={model.height}
              onDelete={handleDeleteMedia}
              onNameUpdate={onNameUpdate}
              isUploaded={model.category === 'uploaded'}
              type={model.type}
              duration={model.duration}
              resolution={model.resolution}
            />
          ))}
        </Masonry>
      )}
    </div>
  )
}