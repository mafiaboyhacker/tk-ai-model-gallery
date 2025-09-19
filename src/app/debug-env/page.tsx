'use client'

import { getEnvironmentInfo } from '@/lib/environment'
import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>(null)

  useEffect(() => {
    const info = getEnvironmentInfo()
    setEnvInfo(info)
    console.log('🔍 Environment Debug Info:', info)
  }, [])

  if (!envInfo) {
    return <div className="p-8">Loading environment info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Debug Information</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Environment</h2>
        <pre className="text-sm">
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Environment Variables (Client)</h2>
        <div className="space-y-2 text-sm">
          <div><strong>DATABASE_URL:</strong> {process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}</div>
          <div><strong>RAILWAY_ENVIRONMENT:</strong> {process.env.RAILWAY_ENVIRONMENT || '❌ Not set'}</div>
          <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV || '❌ Not set'}</div>
        </div>
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Browser Information</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Server-side'}</div>
          <div><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</div>
          <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'Server-side'}</div>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${envInfo.shouldUseRailway ? 'bg-green-100' : 'bg-red-100'}`}>
        <h2 className="text-lg font-semibold mb-3">Storage Selection Result</h2>
        <div className="text-sm">
          <div><strong>Should use Railway:</strong> {envInfo.shouldUseRailway ? '✅ YES' : '❌ NO'}</div>
          <div><strong>Is Production:</strong> {envInfo.isProduction ? '✅ YES' : '❌ NO'}</div>
          <div><strong>Has Railway Config:</strong> {envInfo.hasRailwayConfig ? '✅ YES' : '❌ NO'}</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Expected Behavior</h2>
        <div className="text-sm space-y-1">
          <div>• <strong>Local (localhost):</strong> Should use IndexedDB</div>
          <div>• <strong>Railway (*.railway.app):</strong> Should use Railway PostgreSQL + Volume</div>
          <div>• <strong>Current:</strong> Using {envInfo.shouldUseRailway ? 'Railway' : 'IndexedDB'}</div>
        </div>
      </div>
    </div>
  )
}