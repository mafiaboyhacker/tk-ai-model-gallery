'use client'

import { useState, useEffect } from 'react'

interface SyncStats {
  dbRecords: number
  fileSystemFiles: number
  orphanedDbRecords: number
  orphanedFiles: number
  recoveredFiles: number
}

interface DebugInfo {
  directories: {
    uploads: { path: string; exists: boolean }
    images: { path: string; exists: boolean }
    videos: { path: string; exists: boolean }
  }
  fileCounts: {
    uploads: number
    images: number
    videos: number
  }
  files: {
    uploads: string[]
    images: Array<{ name: string; size: number; created: string; modified: string }>
    videos: Array<{ name: string; size: number; created: string; modified: string }>
  }
  environment: {
    NODE_ENV: string
    RAILWAY_ENVIRONMENT: string
  }
}

interface EnvironmentInfo {
  NODE_ENV: string
  RAILWAY_ENVIRONMENT: string
  RAILWAY_PROJECT_ID: string
  RAILWAY_SERVICE_ID: string
  RAILWAY_VOLUME_MOUNT_PATH: string
  DATABASE_URL: string
  NEXTAUTH_URL: string
  workingDirectory: string
  platform: string
  arch: string
  nodeVersion: string
}

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // 페이지 로드 시 모든 정보 가져오기
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadDebugInfo(),
      loadEnvironmentInfo(),
      loadSyncStats()
    ])
  }

  const loadDebugInfo = async () => {
    try {
      const response = await fetch('/api/railway/storage?action=debug')
      const result = await response.json()
      if (result.success) {
        setDebugInfo(result.debug)
      }
    } catch (err) {
      console.error('Debug info load failed:', err)
    }
  }

  const loadEnvironmentInfo = async () => {
    try {
      const response = await fetch('/api/railway/storage?action=env')
      const result = await response.json()
      if (result.success) {
        setEnvInfo(result.environment)
      }
    } catch (err) {
      console.error('Environment info load failed:', err)
    }
  }

  const loadSyncStats = async () => {
    try {
      const response = await fetch('/api/railway/storage?action=health')
      const result = await response.json()
      if (result.success && result.checks?.sync) {
        setSyncStats({
          dbRecords: 0,
          fileSystemFiles: 0,
          orphanedDbRecords: result.checks.sync.orphanedDbRecords || 0,
          orphanedFiles: result.checks.sync.orphanedFiles || 0,
          recoveredFiles: 0
        })
      }
    } catch (err) {
      console.error('Sync stats load failed:', err)
    }
  }

  const runSync = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/railway/storage?action=sync')
      const result = await response.json()

      if (result.success) {
        setSyncStats(result.data)
        setLastSync(new Date().toLocaleString())
        await loadDebugInfo() // 동기화 후 디버그 정보 새로고침
      } else {
        setError(result.error || 'Sync failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/railway/storage?action=clear-cache')
      const result = await response.json()
      if (result.success) {
        alert('캐시가 클리어되었습니다')
        await loadAllData()
      }
    } catch (err) {
      alert('캐시 클리어 실패')
    }
  }

  const forceClearDb = async () => {
    if (!confirm('⚠️ 모든 DB 레코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/railway/storage?action=force-clear-db')
      const result = await response.json()

      if (result.success) {
        alert(`DB 정리 완료: ${result.deletedRecords}개 레코드 삭제`)
        await loadAllData()
      } else {
        alert(`DB 정리 실패: ${result.error}`)
      }
    } catch (err) {
      alert('DB 정리 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Admin Sync Control Panel</h1>
          <p className="mt-2 text-sm text-gray-600">
            데이터베이스와 파일시스템 동기화 상태를 모니터링하고 관리합니다
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">🔧 Control Panel</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={runSync}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                {loading ? '🔄 Syncing...' : '🔄 Run Sync'}
              </button>
              <button
                onClick={clearCache}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md"
              >
                🧹 Clear Cache
              </button>
              <button
                onClick={forceClearDb}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                🚨 Force Clear DB
              </button>
              <button
                onClick={loadAllData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                🔍 Refresh All
              </button>
            </div>
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                ❌ {error}
              </div>
            )}
            {lastSync && (
              <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ✅ Last sync: {lastSync}
              </div>
            )}
          </div>
        </div>

        {/* Environment Information */}
        {envInfo && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">🌍 Environment Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">Runtime Environment</h3>
                  <p className="text-sm text-gray-600">NODE_ENV: {envInfo.NODE_ENV}</p>
                  <p className="text-sm text-gray-600">Railway: {envInfo.RAILWAY_ENVIRONMENT}</p>
                  <p className="text-sm text-gray-600">Platform: {envInfo.platform}</p>
                  <p className="text-sm text-gray-600">Node: {envInfo.nodeVersion}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">🚨 Volume Path Status</h3>
                  <p className="text-sm font-mono break-all">
                    {envInfo.RAILWAY_VOLUME_MOUNT_PATH}
                  </p>
                  {envInfo.RAILWAY_VOLUME_MOUNT_PATH?.includes('C:/') && (
                    <p className="text-red-600 text-sm font-medium mt-2">
                      ⚠️ Windows 경로 감지! Linux 경로로 변경 필요: /data
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900">Working Directory</h3>
                  <p className="text-sm font-mono text-gray-600">{envInfo.workingDirectory}</p>
                  <p className="text-sm text-gray-600">URL: {envInfo.NEXTAUTH_URL}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status Overview */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">🎯 DB-파일시스템 동기화 상태</h2>
          </div>
          <div className="p-6">
            {/* 전체 동기화 상태 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-gray-800">전체 동기화 상태</h3>
                {syncStats && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    syncStats.dbRecords === syncStats.fileSystemFiles && syncStats.orphanedDbRecords === 0
                      ? 'bg-green-100 text-green-800'
                      : syncStats.orphanedDbRecords > 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {syncStats.dbRecords === syncStats.fileSystemFiles && syncStats.orphanedDbRecords === 0
                      ? '✅ 완전 동기화'
                      : syncStats.orphanedDbRecords > 0
                      ? '❌ 동기화 문제'
                      : '⚠️ 부분 동기화'
                    }
                  </div>
                )}
              </div>

              {/* 이미지/비디오별 상태 */}
              {debugInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🖼️</span>
                        <span className="font-medium text-blue-900">이미지</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-blue-600">{debugInfo.fileCounts.images}</span>
                        <span className={`w-3 h-3 rounded-full ${
                          debugInfo.directories.images.exists ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {debugInfo.directories.images.exists ? '폴더 접근 가능' : '폴더 접근 불가'}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🎬</span>
                        <span className="font-medium text-purple-900">비디오</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-purple-600">{debugInfo.fileCounts.videos}</span>
                        <span className={`w-3 h-3 rounded-full ${
                          debugInfo.directories.videos.exists ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      {debugInfo.directories.videos.exists ? '폴더 접근 가능' : '폴더 접근 불가'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync Statistics */}
        {syncStats && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">📊 상세 동기화 통계</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncStats.dbRecords}</div>
                  <div className="text-sm text-gray-600">DB Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{syncStats.fileSystemFiles}</div>
                  <div className="text-sm text-gray-600">Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{syncStats.orphanedDbRecords}</div>
                  <div className="text-sm text-gray-600">Orphaned DB</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{syncStats.orphanedFiles}</div>
                  <div className="text-sm text-gray-600">Orphaned Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{syncStats.recoveredFiles}</div>
                  <div className="text-sm text-gray-600">Recovered</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File System Debug */}
        {debugInfo && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">🗂️ File System Debug</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Directory Status */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900 mb-3">📁 Directory Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uploads:</span>
                      <span className={debugInfo.directories.uploads.exists ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.directories.uploads.exists ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className={debugInfo.directories.images.exists ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.directories.images.exists ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Videos:</span>
                      <span className={debugInfo.directories.videos.exists ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.directories.videos.exists ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    <div>Images: {debugInfo.directories.images.path}</div>
                    <div>Videos: {debugInfo.directories.videos.path}</div>
                  </div>
                </div>

                {/* File Counts */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900 mb-3">📊 File Counts</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium">{debugInfo.fileCounts.images}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Videos:</span>
                      <span className="font-medium">{debugInfo.fileCounts.videos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{debugInfo.fileCounts.images + debugInfo.fileCounts.videos}</span>
                    </div>
                  </div>
                </div>

                {/* Environment */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900 mb-3">⚙️ Environment</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Node ENV:</span>
                      <div className="font-mono text-sm">{debugInfo.environment.NODE_ENV}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Railway ENV:</span>
                      <div className="font-mono text-sm">{debugInfo.environment.RAILWAY_ENVIRONMENT}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Lists */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">🖼️ Images ({debugInfo.fileCounts.images})</h3>
                  <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
                    {debugInfo.files.images.length > 0 ? (
                      debugInfo.files.images.map((file, idx) => (
                        <div key={idx} className="text-sm mb-2 p-2 bg-white rounded">
                          <div className="font-mono text-xs text-gray-600">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)}MB • {new Date(file.created).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">No images found</div>
                    )}
                  </div>
                </div>

                {/* Videos */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">🎬 Videos ({debugInfo.fileCounts.videos})</h3>
                  <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
                    {debugInfo.files.videos.length > 0 ? (
                      debugInfo.files.videos.map((file, idx) => (
                        <div key={idx} className="text-sm mb-2 p-2 bg-white rounded">
                          <div className="font-mono text-xs text-gray-600">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)}MB • {new Date(file.created).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">No videos found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}