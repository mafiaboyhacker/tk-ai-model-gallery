'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RemovedPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to home page
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Removed</h1>
        <p className="text-gray-600 mb-4">This page has been removed. Redirecting to home...</p>
        <a
          href="/"
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Go to Home
        </a>
      </div>
    </div>
  )
}