'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Cache busting: Force complete page reload - Version 2.0
export default function RemovedPage() {
  const router = useRouter()

  useEffect(() => {
    // Force immediate redirect to break any cache
    window.location.href = '/'
  }, [])

  // Force page refresh by adding meta tags
  useEffect(() => {
    const meta1 = document.createElement('meta')
    meta1.httpEquiv = 'Cache-Control'
    meta1.content = 'no-cache, no-store, must-revalidate'
    document.head.appendChild(meta1)

    const meta2 = document.createElement('meta')
    meta2.httpEquiv = 'Pragma'
    meta2.content = 'no-cache'
    document.head.appendChild(meta2)

    const meta3 = document.createElement('meta')
    meta3.httpEquiv = 'Expires'
    meta3.content = '0'
    document.head.appendChild(meta3)
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{background: '#ffffff'}}>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">🚫 SUPABASE-TEST PAGE REMOVED 🚫</h1>
        <p className="text-xl text-gray-900 mb-4 font-bold">이 페이지는 완전히 삭제되었습니다.</p>
        <p className="text-lg text-gray-700 mb-6">Cache Version: {Date.now()}</p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-8 py-3 rounded text-lg font-bold hover:bg-red-700 transition-colors block mx-auto"
          >
            홈으로 이동
          </button>
          <p className="text-sm text-gray-500">자동 리다이렉트 실행 중...</p>
        </div>
      </div>
    </div>
  )
}