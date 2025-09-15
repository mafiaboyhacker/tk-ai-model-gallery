'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia, isInitialized, usingSupabase, environmentInfo } = useEnvironmentStore()

  // GalleryMediaData를 MasonryGallery가 기대하는 Media 형태로 변환
  const convertedMedia = media.map(item => ({
    id: item.id,
    name: item.fileName || `Media ${item.id}`,
    imageUrl: item.url,
    originalUrl: item.originalUrl,
    imageAlt: `Media: ${item.fileName}`,
    category: item.type,
    width: item.width,
    height: item.height,
    type: item.type,
    duration: item.duration,
    resolution: item.resolution
  }))

  useEffect(() => {
    const initializeMedia = async () => {
      // 환경 초기화가 완료될 때까지 대기
      if (!isInitialized) return

      try {
        await loadMedia()
        console.log(`✅ ${usingSupabase ? 'Supabase' : 'Local'} 미디어 로드 성공:`, media.length, '개')
      } catch (error) {
        console.error(`❌ ${usingSupabase ? 'Supabase' : 'Local'} 미디어 로드 실패:`, error)
      } finally {
        setIsLoaded(true)
      }
    }

    initializeMedia()
  }, [loadMedia, isInitialized, usingSupabase])

  // 미디어 로드 완료 시 추가 로깅
  useEffect(() => {
    if (media.length > 0) {
      console.log(`🎯 메인 페이지: ${media.length}개 미디어 감지됨, 갤러리 업데이트`)
    }
  }, [media])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        {isLoaded ? (
          <MasonryGallery models={convertedMedia} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">
              Loading {usingSupabase ? 'Supabase' : 'Local'} media...
              {!isInitialized && ' (환경 감지 중...)'}
            </div>
          </div>
        )}
      </main>
      
      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
