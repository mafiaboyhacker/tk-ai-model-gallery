'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MasonryGallery from '@/components/MasonryGallery'
import DebugPanel from '@/components/DebugPanel'
import { useSupabaseMediaStore } from '@/store/supabaseMediaStore'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia } = useSupabaseMediaStore()

  useEffect(() => {
    // Supabase Storage에서 실제 업로드된 미디어 로드
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
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        {isLoaded ? (
          <MasonryGallery models={[]} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">Loading media...</div>
          </div>
        )}
      </main>
      
      {/* Development Debug Panel */}
      <DebugPanel />
    </div>
  )
}
