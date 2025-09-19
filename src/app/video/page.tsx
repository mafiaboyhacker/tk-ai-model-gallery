'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

export default function VideoPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia, shuffleMedia } = useEnvironmentStore()

  // 비디오만 필터링
  const videoModels = media.filter(item => item.type === 'video').map(video => ({
    id: video.id,
    name: video.fileName || `Video ${video.id}`,
    imageUrl: video.url,           // 비디오 썸네일
    originalUrl: video.originalUrl, // 원본 비디오
    imageAlt: `Video: ${video.fileName}`,
    category: 'video',
    width: video.width,
    height: video.height,
    type: video.type,
    duration: video.duration,
    resolution: video.resolution
  }))


  useEffect(() => {
    // MediaDB에서 실제 업로드된 미디어 로드
    const initializeMedia = async () => {
      try {
        await loadMedia()

        // 🎲 비디오 로드 후 자동 랜덤화
        setTimeout(() => {
          shuffleMedia()
          console.log('🎲 비디오 페이지: 비디오 순서 자동 랜덤화 완료')
        }, 100)

      } catch (error) {
        console.error('비디오 로드 실패:', error)
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
            <h1 className="nav-text text-2xl text-black/90 mb-2 ml-4" style={{letterSpacing: '0.1em'}}>VIDEO GALLERY &lt;</h1>

          </div>

          {isLoaded ? (
            videoModels.length > 0 ? (
              <MasonryGallery models={videoModels} />
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">비디오가 없습니다</h3>
                <p className="text-gray-500">
                  아직 업로드된 비디오가 없습니다
                </p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-gray-500">Loading videos...</div>
            </div>
          )}
        </div>
      </main>

      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}