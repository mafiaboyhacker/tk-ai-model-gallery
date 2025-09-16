'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

export default function ModelPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const { media, loadMedia, shuffleMedia } = useEnvironmentStore()

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

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setIsContactOpen(false)
      }
    }

    if (isContactOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isContactOpen])

  useEffect(() => {
    // MediaDB에서 실제 업로드된 미디어 로드
    const initializeMedia = async () => {
      try {
        await loadMedia()

        // 🎲 모델 이미지 로드 후 자동 랜덤화
        setTimeout(() => {
          shuffleMedia()
          console.log('🎲 모델 페이지: 이미지 순서 자동 랜덤화 완료')
        }, 100)

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
          <div className="mb-8 flex justify-between items-center">
            <h1 className="nav-text text-2xl text-black/90 mb-2 ml-4" style={{letterSpacing: '0.1em'}}>MODEL GALLERY &lt;</h1>

            {/* Contact 버튼 */}
            <div className="relative" ref={contactRef}>
              <button
                onClick={() => setIsContactOpen(!isContactOpen)}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
              >
                Contact for Licensing
              </button>

              {/* 말풍선 스타일 드롭다운 - 위로 올라오도록 */}
              {isContactOpen && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-10">
                  {/* 말풍선 화살표 - 아래쪽 */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/90 backdrop-blur-xl border-r border-b border-gray-200 rotate-45"></div>

                  {/* 내용 */}
                  <div className="p-6 relative">
                    {/* 닫기 버튼 */}
                    <button
                      onClick={() => setIsContactOpen(false)}
                      className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 transition-colors text-xl w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      ×
                    </button>

                    {/* Coming Soon 내용 */}
                    <div className="text-center font-sans">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        COMING SOON
                      </h3>
                      <div className="text-sm text-gray-700">
                        <p className="mb-2">문의는</p>
                        <p className="font-semibold text-gray-800">김태은</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isLoaded ? (
            imageModels.length > 0 ? (
              <MasonryGallery models={imageModels} />
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