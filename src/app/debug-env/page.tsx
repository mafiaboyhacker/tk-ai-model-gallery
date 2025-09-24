'use client'

import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>(null)

  useEffect(() => {
    const info = {
      environment: 'Railway',
      isProduction: process.env.NODE_ENV === 'production',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'Server-side',
      origin: typeof window !== 'undefined' ? window.location.origin : 'Server-side',
      timestamp: new Date().toISOString()
    }
    setEnvInfo(info)
    console.log('🔍 Railway Debug Info:', info)
  }, [])

  if (!envInfo) {
    return <div className="p-8">Loading environment info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Railway Environment Debug</h1>

      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Environment</h2>
        <div className="text-sm space-y-2">
          <div><strong>Environment:</strong> ✅ Railway (환경감지 제거됨)</div>
          <div><strong>Storage:</strong> ✅ PostgreSQL + Volume</div>
          <div><strong>Is Production:</strong> {envInfo.isProduction ? '✅ YES' : '❌ NO'}</div>
        </div>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
        <div className="space-y-2 text-sm">
          <div><strong>DATABASE_URL:</strong> {process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}</div>
          <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV || '❌ Not set'}</div>
          <div><strong>RAILWAY_ENVIRONMENT:</strong> {process.env.RAILWAY_ENVIRONMENT || '❌ Not set'}</div>
        </div>
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Browser Information</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Hostname:</strong> {envInfo.hostname}</div>
          <div><strong>Origin:</strong> {envInfo.origin}</div>
          <div><strong>Timestamp:</strong> {envInfo.timestamp}</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">System Status</h2>
        <div className="text-sm space-y-1">
          <div>• ✅ <strong>Environment Detection:</strong> 제거됨 (Railway 전용)</div>
          <div>• ✅ <strong>Storage System:</strong> Railway PostgreSQL + Volume</div>
          <div>• ✅ <strong>Media Serving:</strong> Direct Volume serving (/uploads/)</div>
        </div>
      </div>
    </div>
  )
}