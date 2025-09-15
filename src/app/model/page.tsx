'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useImageStore } from '@/store/imageStore'

export default function ModelPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia } = useImageStore()

  // 이미지만 필터링 (모델 카테고리는 이미지만)
  const imageModels = media.filter(item => item.type === 'image').map(image => ({
    id: image.id,
    name: image.fileName || `Model ${image.id}`,
    imageUrl: image.url,           // 이미지 썸네일
    originalUrl: image.originalUrl, // 원본 이미지
    imageAlt: `Model: ${image.fileName}`,
    category: 'model',
    width: image.width,
    height: image.height,
    type: image.type
  }))

  useEffect(() => {
    // MediaDB에서 실제 업로드된 미디어 로드
    const initializeMedia = async () => {
      try {
        await loadMedia()
      } catch (error) {
        console.error('모델 이미지 로드 실패:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    initializeMedia()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="nav-text text-2xl text-black/90 mb-2 ml-4" style={{letterSpacing: '0.1em'}}>MODEL GALLERY &lt;</h1>
          </div>

          {isLoaded ? (
            imageModels.length > 0 ? (
              <MasonryGallery models={[]} />
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">모델 이미지가 없습니다</h3>
                <p className="text-gray-500">
                  아직 업로드된 모델 이미지가 없습니다
                </p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-gray-500">Loading models...</div>
            </div>
          )}
        </div>
      </main>

      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}