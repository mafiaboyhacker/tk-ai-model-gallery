'use client'

import { useState, useEffect } from 'react'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import AdminUpload from '@/components/AdminUpload'
import AdminMasonryGallery from '@/components/AdminMasonryGallery'

export default function OverviewTab() {
  const [showUpload, setShowUpload] = useState(false)
  const [storageStats, setStorageStats] = useState({ count: 0, estimatedSize: '0 MB', images: 0, videos: 0 })
  const { media, clearMedia, loadMedia, getStorageStats, updateCustomName } = useRailwayMediaStore()

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
        environment: usingRailway ? 'Railway' : 'Local',
        mediaCount: media.length,
        timestamp: new Date().toISOString()
      })

      try {
        const stats = await getStorageStats()

        // Railway 환경에서는 실제 media 배열과 비교하여 검증
        if (usingRailway) {
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
        }

        setStorageStats({
          count: stats.count,
          estimatedSize: stats.estimatedSize,
          images: stats.images,
          videos: stats.videos
        })

        console.log('📊 실시간 통계 업데이트 완료:', {
          ...stats,
          dataSource: usingRailway ? 'Railway PostgreSQL' : 'IndexedDB',
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
  }, [media, getStorageStats, usingRailway]) // usingRailway도 의존성에 추가

  // 미디어 데이터를 AdminMasonryGallery가 기대하는 형식으로 변환
  const modelsForGallery = media.map((mediaItem, index) => {
    return {
      id: mediaItem.id,
      name: mediaItem.customName || mediaItem.fileName || `${mediaItem.type === 'video' ? 'Video' : 'Model'} #${index + 1}`,
      imageUrl: mediaItem.url,
      originalUrl: mediaItem.originalUrl,
      imageAlt: `${mediaItem.type === 'video' ? 'Video' : 'Image'}: ${mediaItem.fileName}`,
      category: 'uploaded',
      width: mediaItem.width || 400,
      height: mediaItem.height || 400,
      type: mediaItem.type,
      duration: mediaItem.duration,
      resolution: mediaItem.resolution
    }
  })

  // 이름 업데이트 핸들러 (환경별 자동 스토리지에서 커스텀 이름 수정)
  const handleUpdateName = async (id: string, newName: string) => {
    try {
      // 환경별 자동 선택된 스토어의 updateCustomName 사용
      if (updateCustomName) {
        await updateCustomName(id, newName)
        console.log(`✅ ${usingRailway ? 'Railway' : 'Local'} 커스텀 이름 업데이트 완료:`, id, newName)
      } else {
        console.log('⚠️ 커스텀 이름 업데이트 기능이 없습니다:', id, newName)
      }
    } catch (error) {
      console.error(`❌ ${usingRailway ? 'Railway' : 'Local'} 이름 업데이트 실패:`, error)
      throw error
    }
  }

  // 상세한 데이터 분석 로그
  console.log('📊 어드민 오버뷰 탭 - 상세 데이터 분석:')
  console.log(`   - 원본 media 배열 길이: ${media.length}`)
  console.log(`   - 변환된 modelsForGallery 길이: ${modelsForGallery.length}`)
  console.log(`   - storageStats:`, storageStats)

  if (media.length > 0) {
    const imageCount = media.filter(m => m.type === 'image').length
    const videoCount = media.filter(m => m.type === 'video').length
    console.log(`   - 실제 데이터 분포: 이미지 ${imageCount}개, 비디오 ${videoCount}개`)

    // 비디오 데이터만 따로 분석
    const videos = media.filter(m => m.type === 'video')
    if (videos.length > 0) {
      console.log(`   - 비디오 데이터 상세:`)
      videos.forEach((video, index) => {
        console.log(`     ${index + 1}. ${video.fileName} (type: ${video.type}, duration: ${video.duration})`)
      })
    } else {
      console.log('   - ⚠️ 비디오 데이터가 없습니다!')
    }
  }

  // 일괄 이름 변경 핸들러
  const handleRenameAll = async () => {
    if (confirm('Are you sure you want to rename all media? This will reset names to MODEL #1, MODEL #2... and VIDEO #1, VIDEO #2... format.')) {
      try {
        console.log('🏷️ 모든 미디어 이름 일괄 변경 중...')

        // 이미지와 비디오 분리
        const images = media.filter(m => m.type === 'image')
        const videos = media.filter(m => m.type === 'video')

        let successCount = 0
        let totalCount = images.length + videos.length

        // 이미지 이름 변경 (MODEL #1, MODEL #2...)
        for (let i = 0; i < images.length; i++) {
          const newName = `MODEL #${i + 1}`
          try {
            await updateCustomName(images[i].id, newName)
            successCount++
            console.log(`✅ 이미지 이름 변경: ${images[i].id} → ${newName}`)
          } catch (error) {
            console.error(`❌ 이미지 이름 변경 실패: ${images[i].id}`, error)
          }
        }

        // 비디오 이름 변경 (VIDEO #1, VIDEO #2...)
        for (let i = 0; i < videos.length; i++) {
          const newName = `VIDEO #${i + 1}`
          try {
            await updateCustomName(videos[i].id, newName)
            successCount++
            console.log(`✅ 비디오 이름 변경: ${videos[i].id} → ${newName}`)
          } catch (error) {
            console.error(`❌ 비디오 이름 변경 실패: ${videos[i].id}`, error)
          }
        }

        console.log(`✅ 이름 변경 완료: ${successCount}/${totalCount}개 성공`)
        alert(`Successfully renamed ${successCount}/${totalCount} media files.\nImages: MODEL #1-${images.length}\nVideos: VIDEO #1-${videos.length}`)

        // 미디어 다시 로드하여 최신 상태 반영
        await loadMedia()

      } catch (error) {
        console.error('❌ 일괄 이름 변경 실패:', error)
        alert('Failed to rename media. Please try again.')
      }
    }
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL uploaded media (images & videos)? This cannot be undone.')) {
      try {
        console.log('🗑️ 모든 미디어 삭제 중...')
        await clearMedia()
        console.log('✅ 모든 미디어 삭제 완료')
        alert('All media has been successfully deleted.')
      } catch (error) {
        console.error('❌ 미디어 삭제 실패:', error)
        alert('Failed to clear media. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Media Overview</h2>
            <p className="text-gray-600">
              Complete overview of your media gallery with quick actions and statistics
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Quick Upload</span>
            </button>
            {media.length > 0 && (
              <>
                <button
                  onClick={handleRenameAll}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Rename All</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H5m14 8H5m14 4H5" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{storageStats.count}</div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{storageStats.images}</div>
                <div className="text-sm text-gray-600">Images</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{storageStats.videos}</div>
                <div className="text-sm text-gray-600">Videos</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {storageStats.estimatedSize}
                </div>
                <div className="text-sm text-gray-600">
                  {usingRailway ? 'Railway Storage' : 'Local Storage'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Media Gallery */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Media Files</h3>
            <p className="text-sm text-gray-600">
              Combined view of all images and videos in masonry layout
            </p>
          </div>
          {media.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {media.length} files
            </div>
          )}
        </div>

        {modelsForGallery.length > 0 ? (
          <AdminMasonryGallery
            models={modelsForGallery}
            onNameUpdate={handleUpdateName}
          />
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No media uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first images or videos.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                Upload Media
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Upload Modal */}
      <AdminUpload
        isVisible={showUpload}
        onClose={() => setShowUpload(false)}
      />
    </div>
  )
}