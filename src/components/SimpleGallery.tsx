'use client'

import { useState, useEffect, memo } from 'react'
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
}

interface SimpleGalleryProps {
  models: Media[]
  loading?: boolean
}

// 🚀 Simple CSS Grid Gallery - 가상화 없이 모든 이미지 항상 표시
const SimpleGallery = memo(function SimpleGallery({ models, loading = false }: SimpleGalleryProps) {
  const [mounted, setMounted] = useState(false)
  const [columnsCount, setColumnsCount] = useState(2)

  useEffect(() => {
    setMounted(true)

    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1536) setColumnsCount(6)       // 2xl
      else if (width >= 1280) setColumnsCount(5)  // xl
      else if (width >= 1024) setColumnsCount(4)  // lg
      else if (width >= 768) setColumnsCount(3)   // md
      else if (width >= 640) setColumnsCount(2)   // sm
      else setColumnsCount(1)                     // xs
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">갤러리 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <div className="text-gray-500 text-sm mt-2">갤러리 준비 중...</div>
        </div>
      </div>
    )
  }

  if (!models || models.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">아직 업로드된 미디어가 없습니다</h3>
          <p className="text-gray-500">어드민에서 이미지나 비디오를 업로드해보세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* CSS Grid 갤러리 - 가상화 없음 */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
          gridAutoRows: 'auto'
        }}
      >
        {models.map((model, index) => {
          // 이미지 높이 계산 (responsive)
          const aspectRatio = model.width / model.height
          const baseWidth = 300 // 기본 너비
          const calculatedHeight = baseWidth / aspectRatio

          return (
            <div key={`${model.id}-${index}`} className="w-full">
              <SafeModelCard
                id={model.id}
                name={model.name}
                imageUrl={model.imageUrl}
                originalUrl={model.originalUrl}
                imageAlt={model.imageAlt}
                category={model.category}
                width={baseWidth}
                height={calculatedHeight}
                type={model.type}
                duration={model.duration}
                resolution={model.resolution}
                isAdminMode={false}
              />
            </div>
          )
        })}
      </div>

      {/* 로딩 완료 표시 */}
      <div className="text-center mt-8 py-4 text-gray-500 text-sm">
        ✅ 총 {models.length}개의 미디어 파일이 표시되었습니다
        <br />
        <span className="text-xs text-gray-400">
          {columnsCount}열 그리드 레이아웃 · 가상화 없음 · 모든 이미지 항상 표시
        </span>
      </div>
    </div>
  )
})

export default SimpleGallery