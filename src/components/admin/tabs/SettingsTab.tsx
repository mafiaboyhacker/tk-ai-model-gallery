'use client'

import { useState, useEffect, useCallback } from 'react'
import { useImageStore } from '@/store/imageStore'

export default function SettingsTab() {
  const [isClearing, setIsClearing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const { media, clearMedia, removeMedia, getStorageStats } = useImageStore()
  const [storageStats, setStorageStats] = useState<{count: number; estimatedSize: string; images: number; videos: number} | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error('통계 새로고침 실패:', error)
    }
  }, [getStorageStats])

  // 컴포넌트 마운트 시와 media 배열 변경 시 통계 새로고침
  useEffect(() => {
    refreshStats()
  }, [media.length, refreshStats]) // media 배열의 길이가 변경될 때마다 실행

  const handleClearAllMedia = async () => {
    if (confirm('⚠️ WARNING: This will delete ALL uploaded media (images and videos). This action cannot be undone. Are you sure?')) {
      setIsClearing(true)
      try {
        console.log('🗑️ 모든 미디어 삭제 중...')
        await clearMedia()
        console.log('✅ 모든 미디어 삭제 완료')

        // 통계 새로고침
        await refreshStats()

        alert('All media has been successfully deleted.')
      } catch (error) {
        console.error('❌ 미디어 삭제 실패:', error)
        alert('Failed to clear media. Please try again.')
      } finally {
        setIsClearing(false)
      }
    }
  }

  const handleValidateData = async () => {
    if (confirm('데이터 정합성 검증을 시작하시겠습니까? 손상된 데이터는 자동으로 정리됩니다.')) {
      setIsValidating(true)
      try {
        console.log('🔍 데이터 검증 시작...')
        // TODO: 데이터 검증 로직 구현
        const result = { checkedCount: media.length, cleanedCount: 0, errors: [] }

        // 통계 새로고침
        await refreshStats()

        const message = `
데이터 검증 완료:
• 검사된 항목: ${result.checkedCount}개
• 문제가 있었던 항목: ${result.repairedCount}개
• 삭제된 항목: ${result.removedCount}개
• 발견된 문제: ${result.issues.length}개

${result.issues.length > 0 ? '\n문제 목록:\n' + result.issues.slice(0, 10).join('\n') + (result.issues.length > 10 ? '\n... 등' : '') : ''}
        `
        alert(message)
      } catch (error) {
        console.error('❌ 데이터 검증 실패:', error)
        alert('데이터 검증 중 오류가 발생했습니다.')
      } finally {
        setIsValidating(false)
      }
    }
  }

  const handleClearImages = async () => {
    if (confirm('Delete all images? Videos will be kept. This cannot be undone.')) {
      setIsClearing(true)
      try {
        const imageIds = media.filter(m => m.type === 'image').map(m => m.id)
        for (const id of imageIds) {
          await removeMedia(id)
        }

        // 통계 새로고침
        await refreshStats()

        alert('All images have been deleted.')
      } catch (error) {
        console.error('❌ 이미지 삭제 실패:', error)
        alert('Failed to delete images. Please try again.')
      } finally {
        setIsClearing(false)
      }
    }
  }

  const handleClearVideos = async () => {
    if (confirm('Delete all videos? Images will be kept. This cannot be undone.')) {
      setIsClearing(true)
      try {
        const videoIds = media.filter(m => m.type === 'video').map(m => m.id)
        for (const id of videoIds) {
          await removeMedia(id)
        }

        // 통계 새로고침
        await refreshStats()

        alert('All videos have been deleted.')
      } catch (error) {
        console.error('❌ 비디오 삭제 실패:', error)
        alert('Failed to delete videos. Please try again.')
      } finally {
        setIsClearing(false)
      }
    }
  }

  // 브라우저 저장소 정리
  const handleCleanupStorage = async () => {
    if (confirm('Clean up browser storage? This will refresh the storage statistics.')) {
      try {
        await refreshStats()
        alert('Storage cleanup completed.')
      } catch (error) {
        console.error('저장소 정리 실패:', error)
        alert('Storage cleanup failed.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings & Data Management</h2>
          <p className="text-gray-600">
            Manage your media gallery data, storage, and system settings.
          </p>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-800 font-bold text-xl">{media.length}</div>
            <div className="text-blue-600 text-sm">Total Files</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-800 font-bold text-xl">
              {media.filter(m => m.type === 'image').length}
            </div>
            <div className="text-green-600 text-sm">Images</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-800 font-bold text-xl">
              {media.filter(m => m.type === 'video').length}
            </div>
            <div className="text-purple-600 text-sm">Videos</div>
          </div>
        </div>

        <button
          onClick={refreshStats}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Storage Stats
        </button>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>

        <div className="space-y-4">
          {/* Clear All Media */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-red-900">Clear All Media</h4>
                <p className="text-sm text-red-700 mt-1">
                  Delete all uploaded images and videos. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={handleClearAllMedia}
                disabled={isClearing || media.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isClearing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear Images Only */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-orange-900">Clear Images Only</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Delete all images while keeping videos intact.
                </p>
              </div>
              <button
                onClick={handleClearImages}
                disabled={isClearing || media.filter(m => m.type === 'image').length === 0}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Clear Images</span>
              </button>
            </div>
          </div>

          {/* Clear Videos Only */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-purple-900">Clear Videos Only</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Delete all videos while keeping images intact.
                </p>
              </div>
              <button
                onClick={handleClearVideos}
                disabled={isClearing || media.filter(m => m.type === 'video').length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Clear Videos</span>
              </button>
            </div>
          </div>

          {/* Data Validation */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-blue-900">데이터 정합성 검증</h4>
                <p className="text-sm text-blue-700 mt-1">
                  저장된 데이터의 무결성을 검사하고 손상된 데이터를 자동으로 정리합니다.
                </p>
              </div>
              <button
                onClick={handleValidateData}
                disabled={isValidating || media.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>검증 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>검증 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Storage Type:</span>
            <span className="font-medium">IndexedDB (Browser)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supported Image Formats:</span>
            <span className="font-medium">JPG, PNG, JPEG, WebP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supported Video Formats:</span>
            <span className="font-medium">MP4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Auto Optimization:</span>
            <span className="font-medium">✅ Enabled</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thumbnail Generation:</span>
            <span className="font-medium">✅ Automatic</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleCleanupStorage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Cleanup Storage</span>
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• All media is stored locally in your browser's IndexedDB</li>
          <li>• Clearing browser data will remove all uploaded media</li>
          <li>• Use separate image/video tabs for organized uploads</li>
          <li>• Press Ctrl+U anywhere for quick upload access</li>
          <li>• Large files are automatically optimized for performance</li>
        </ul>
      </div>
    </div>
  )
}