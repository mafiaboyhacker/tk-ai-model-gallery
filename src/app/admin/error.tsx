'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Admin Page Error
          </h2>
          <p className="text-red-600 mb-4">
            An error occurred in the admin interface.
          </p>
          <div className="space-y-2">
            <button
              onClick={reset}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors w-full"
            >
              Try again
            </button>
            <a
              href="/admin"
              className="block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Back to Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}