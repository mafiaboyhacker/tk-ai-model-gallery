'use client'

import { useState, useEffect } from 'react'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import AdminUpload from '@/components/AdminUpload'
import AdminMasonryGallery from '@/components/AdminMasonryGallery'

export default function OverviewTab() {
  const [showUpload, setShowUpload] = useState(false)
  const [storageStats, setStorageStats] = useState({ count: 0, estimatedSize: '0 MB', images: 0, videos: 0 })
  const { media, loadMedia, getStorageStats, updateCustomName } = useRailwayMediaStore()

  // 컴포넌트 마운트시 미디어 로드
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log('🔄 오버뷰 탭: Railway 미디어 로드 중...')

        await loadMedia()

        // 스토리지 통계 업데이트
        const stats = await getStorageStats()
        setStorageStats({
          count: stats.count,
          estimatedSize: stats.estimatedSize,
          images: stats.images,
          videos: stats.videos
        })
        console.log('📊 Railway 스토리지 통계:', stats)
      } catch (error) {
        console.error('❌ 오버뷰 탭: Railway 미디어 로드 실패:', error)
      }
    }

    initializeMedia()
  }, [loadMedia])

  // 미디어 상태 변화 감지하여 통계 실시간 업데이트
  useEffect(() => {
    const updateStats = async () => {
      console.log('🔄 통계 업데이트 시작:', {
        environment: 'Railway',
        mediaCount: media.length,
        timestamp: new Date().toISOString()
      })

      try {
        const stats = await getStorageStats()

        // Railway 환경에서는 실제 media 배열과 비교하여 검증
        const actualImages = media.filter(m => m.type === 'image').length
        const actualVideos = media.filter(m => m.type === 'video').length

        console.log('🔍 Railway 환경 통계 검증:', {
          'getStorageStats 결과': stats,
          '실제 media 배열': {
            total: media.length,
            images: actualImages,
            videos: actualVideos
          },
          '일치 여부': {
            count: stats.count === media.length,
            images: stats.images === actualImages,
            videos: stats.videos === actualVideos
          }
        })

        // Railway 환경에서 불일치 발견 시 실제 데이터 우선 사용
        if (stats.count !== media.length || stats.images !== actualImages || stats.videos !== actualVideos) {
          console.log('⚠️ Railway 통계 불일치 감지 - 실제 데이터 사용')
          const correctedStats = {
            count: media.length,
            estimatedSize: stats.estimatedSize, // 파일 크기는 getStorageStats 사용
            images: actualImages,
            videos: actualVideos
          }
          setStorageStats(correctedStats)
          console.log('✅ 수정된 통계 적용:', correctedStats)
          return
        }

        setStorageStats({
          count: stats.count,
          estimatedSize: stats.estimatedSize,
          images: stats.images,
          videos: stats.videos
        })

        console.log('📊 실시간 통계 업데이트 완료:', {
          ...stats,
          dataSource: 'Railway PostgreSQL',
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('❌ 통계 업데이트 실패:', error)

        // 오류 발생 시 실제 media 배열에서 직접 계산
        const fallbackImages = media.filter(m => m.type === 'image').length
        const fallbackVideos = media.filter(m => m.type === 'video').length
        const fallbackStats = {
          count: media.length,
          estimatedSize: '계산 중...',
          images: fallbackImages,
          videos: fallbackVideos
        }

        setStorageStats(fallbackStats)
        console.log('🚨 Fallback 통계 사용:', fallbackStats)
      }
    }

    updateStats()
  }, [media, getStorageStats])

  // 미디어 데이터를 AdminMasonryGallery가 기대하는 형식으로 변환
  const modelsForGallery = media.map((mediaItem, index) => {
    return {
      id: mediaItem.id,
      name: mediaItem.customName || mediaItem.fileName || `Media ${mediaItem.id}`,
      imageUrl: mediaItem.url,
      originalUrl: mediaItem.originalUrl,
      imageAlt: `${mediaItem.type}: ${mediaItem.fileName}`,
      category: mediaItem.type,
      width: mediaItem.width,
      height: mediaItem.height,
      type: mediaItem.type,
      duration: mediaItem.duration,
      resolution: mediaItem.resolution
    }
  })

  // 커스텀 이름 업데이트 핸들러
  const handleUpdateName = async (id: string, newName: string) => {
    try {
      await updateCustomName(id, newName)
      console.log('✅ Railway 커스텀 이름 업데이트 완료:', id, newName)

      // 통계 다시 로드
      await loadMedia()
    } catch (error) {
      console.error('❌ Railway 이름 업데이트 실패:', error)
    }
  }


  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Overview</h2>
        <p className="text-gray-600">미디어 파일 관리 및 통계</p>
      </div>

      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">총 파일</h3>
          <p className="text-2xl font-bold text-blue-600">{storageStats.count}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">이미지</h3>
          <p className="text-2xl font-bold text-green-600">{storageStats.images}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">비디오</h3>
          <p className="text-2xl font-bold text-purple-600">{storageStats.videos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">용량</h3>
          <p className="text-2xl font-bold text-orange-600">{storageStats.estimatedSize}</p>
          <p className="text-xs text-gray-500 mt-1">
            Railway Storage
          </p>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {showUpload ? '업로드 숨기기' : '파일 업로드'}
        </button>

        <button
          onClick={loadMedia}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          새로고침
        </button>
      </div>

      {/* 업로드 컴포넌트 */}
      {showUpload && (
        <div className="mb-6">
          <AdminUpload
            isVisible={true}
            onClose={() => setShowUpload(false)}
            onUploadComplete={async () => {
              console.log('✅ 업로드 완료 - 미디어 새로고침 중...')
              await loadMedia()

              // 통계 업데이트
              const stats = await getStorageStats()
              setStorageStats({
                count: stats.count,
                estimatedSize: stats.estimatedSize,
                images: stats.images,
                videos: stats.videos
              })
            }}
          />
        </div>
      )}

      {/* 갤러리 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">미디어 갤러리</h3>
          <p className="text-sm text-gray-500">총 {storageStats.count}개 파일</p>
        </div>
        <div className="p-4">
          <AdminMasonryGallery
            models={modelsForGallery}
            onUpdateName={handleUpdateName}
          />
        </div>
      </div>
    </div>
  )
}