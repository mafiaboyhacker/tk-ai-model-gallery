'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // /admin 접속시 자동으로 /admin/overview로 리다이렉트
    router.replace('/admin/overview')
  }, [router])

  // 리다이렉트 중 표시될 로딩 화면
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="text-gray-600">Redirecting to admin overview...</div>
      </div>
    </div>
  )
}