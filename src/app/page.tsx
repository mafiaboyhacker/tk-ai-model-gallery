'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useSupabaseMediaStore } from '@/store/supabaseMediaStore'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia } = useSupabaseMediaStore()

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
      try {
        await loadMedia()
      } catch (error) {
        console.error('Supabase 미디어 로드 실패:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    initializeMedia()
  }, [loadMedia])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        {isLoaded ? (
          <MasonryGallery models={convertedMedia} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">Loading Supabase media...</div>
          </div>
        )}
      </main>
      
      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
