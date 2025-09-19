'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import OverviewTab from '@/components/admin/tabs/OverviewTab'

export default function AdminOverviewPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { media, loadMedia, isInitialized, usingRailway } = useEnvironmentStore()

  useEffect(() => {
    const initializeMedia = async () => {
      if (!isInitialized) return

      try {
        await loadMedia()
        console.log(`✅ Admin ${usingRailway ? 'Railway' : 'Local'} 미디어 로드 성공:`, media.length, '개')
      } catch (error) {
        console.error(`❌ Admin ${usingRailway ? 'Railway' : 'Local'} 미디어 로드 실패:`, error)
      } finally {
        setIsLoaded(true)
      }
    }

    initializeMedia()
  }, [loadMedia, isInitialized, usingRailway])

  // 탭별 미디어 카운트 계산
  const imageCount = media.filter(m => m.type === 'image').length
  const videoCount = media.filter(m => m.type === 'video').length
  const totalCount = media.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Media Management</h1>
            <p className="text-sm text-gray-300 mt-1">
              Manage your AI Model Gallery - Images & Videos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* 스토리지 상태 표시 */}
            <div className="text-sm text-gray-300 text-right">
              <div className="font-medium">{media.length} total files</div>
              <div className="text-xs text-gray-400">
                {usingRailway ? '🚀 Railway PostgreSQL' : '💾 Local IndexedDB'}
              </div>
            </div>

            {/* 캐시 삭제 버튼 */}
            <button
              onClick={async () => {
                if (confirm('⚠️ 모든 브라우저 저장소를 완전히 정리하시겠습니까?\n(IndexedDB, LocalStorage, 캐시 등 모든 데이터가 삭제됩니다)')) {
                  try {
                    const response = await fetch('/api/force-clear-indexeddb', { method: 'POST' })
                    const data = await response.json()
                    if (data.success) {
                      // 스크립트 실행
                      eval(data.script)
                    }
                  } catch (error) {
                    console.error('캐시 삭제 실패:', error)
                    alert('캐시 삭제에 실패했습니다.')
                  }
                }
              }}
              className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded-lg transition-colors text-sm font-bold"
            >
              🧹 Force Clear All
            </button>

            <Link
              href="/"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Gallery</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8 px-6">
            <Link
              href="/admin/overview"
              className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm"
            >
              📊 Overview
              {totalCount > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {totalCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/images"
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors"
            >
              📷 Images
              {imageCount > 0 && (
                <span className="ml-2 bg-green-100 text-green-600 py-1 px-2 rounded-full text-xs">
                  {imageCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/videos"
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors"
            >
              🎥 Videos
              {videoCount > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 py-1 px-2 rounded-full text-xs">
                  {videoCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/settings"
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto p-6">
        {isLoaded ? (
          <OverviewTab />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">Loading admin panel...</div>
          </div>
        )}
      </main>
    </div>
  )
}