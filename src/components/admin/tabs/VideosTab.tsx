'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import AdminModelCard from '@/components/AdminModelCard'

export default function VideosTab() {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { media, addMedia, removeMedia, loadMedia, updateCustomName, usingRailway } = useEnvironmentStore()

  // 컴포넌트 마운트시 미디어 로드
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log(`🔄 비디오 탭: ${usingRailway ? 'Railway' : 'Local'}에서 미디어 로드 중...`)
        await loadMedia()
      } catch (error) {
        console.error(`❌ 비디오 탭: ${usingRailway ? 'Railway' : 'Local'} 로드 실패:`, error)
      }
    }

    initializeMedia()
  }, [loadMedia])

  // 비디오만 필터링
  const videos = media.filter(item => item.type === 'video')

  // 비디오 데이터를 ModelCard 형식으로 변환
  const videoModels = videos.map((videoItem, index) => ({
    id: videoItem.id,
    name: (videoItem as any).customName || `비디오 #${index + 1}`,
    imageUrl: videoItem.url,
    originalUrl: videoItem.originalUrl,
    imageAlt: `Video: ${videoItem.fileName}`,
    category: 'uploaded',
    width: videoItem.width || 400,
    height: videoItem.height || 300,
    type: videoItem.type,
    duration: videoItem.duration,
    resolution: videoItem.resolution
  }))

  // 디버그: 비디오 데이터 로깅
  useEffect(() => {
    console.log('📹 VideosTab 디버그 - 전체 미디어:', media.length)
    console.log('📹 VideosTab 디버그 - 비디오 개수:', videos.length)
    videos.forEach((video, index) => {
      console.log(`📹 비디오 ${index + 1}:`, {
        id: video.id,
        fileName: video.fileName,
        type: video.type,
        url: video.url ? `${video.url.substring(0, 50)}...` : 'null',
        originalUrl: video.originalUrl ? `${video.originalUrl.substring(0, 50)}...` : 'null',
        duration: video.duration,
        resolution: video.resolution
      })
    })
  }, [media, videos])

  const processVideoFiles = useCallback(async (files: FileList) => {
    setUploading(true)

    try {
      // 비디오 파일만 필터링
      const videoFiles = Array.from(files).filter(file =>
        file.type.startsWith('video/')
      )

      if (videoFiles.length === 0) {
        alert('Please select valid video files (MP4)')
        setUploading(false)
        return
      }

      console.log(`🎥 비디오 업로드 시작: ${videoFiles.length}개`)

      await addMedia(videoFiles)

      setUploading(false)
      console.log('✅ 비디오 업로드 완료')

    } catch (error) {
      console.error('❌ 비디오 업로드 실패:', error)
      setUploading(false)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addMedia])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processVideoFiles(files)
    }
  }, [processVideoFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processVideoFiles(files)
    }
  }, [processVideoFiles])

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await removeMedia(id)
        console.log('✅ 비디오 삭제 완료:', id)
      } catch (error) {
        console.error('❌ 비디오 삭제 실패:', error)
        alert('Failed to delete video. Please try again.')
      }
    }
  }

  const handleUpdateVideoName = async (id: string, newName: string) => {
    try {
      await updateCustomName(id, newName)
      console.log('✅ 비디오 이름 업데이트 완료:', id, newName)
      // 이름 업데이트 후 미디어 다시 로드하여 UI 동기화
      await loadMedia()
    } catch (error) {
      console.error('❌ 비디오 이름 업데이트 실패:', error)
      throw error // AdminModelCard에서 에러 처리
    }
  }

  // 재생시간 포맷팅
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Videos Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Management</h2>
            <p className="text-gray-600">
              Upload and manage video files. Supports MP4 format with automatic thumbnail generation.
            </p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <div className="text-purple-800 font-bold text-lg">{videoModels.length}</div>
            <div className="text-purple-600 text-sm">Videos</div>
          </div>
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Videos</h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-purple-600">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-medium">Processing videos...</p>
              <p className="text-sm text-gray-600 mt-2">Extracting thumbnails and metadata</p>
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Video Files</p>
                <p className="text-sm text-gray-500">
                  Drag and drop video files here, or click to select
                </p>
              </div>

              <input
                type="file"
                multiple
                accept="video/mp4"
                onChange={handleFileInput}
                className="hidden"
                id="video-file-upload"
              />
              <label
                htmlFor="video-file-upload"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors inline-block font-medium"
              >
                Select Video Files
              </label>
            </>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-4 bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎥 Supported Video Formats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-purple-700">
            <div>• MP4 (.mp4)</div>
            <div>• Automatic thumbnails</div>
            <div>• Duration detection</div>
            <div>• Resolution info</div>
          </div>
        </div>
      </div>

      {/* Videos Gallery */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video Gallery</h3>
            <p className="text-sm text-gray-600">
              All uploaded videos with management options
            </p>
          </div>
          {videoModels.length > 0 && (
            <div className="text-sm text-gray-500">
              {videoModels.length} video{videoModels.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {videoModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videoModels.map((videoModel) => (
              <AdminModelCard
                key={videoModel.id}
                id={videoModel.id}
                name={videoModel.name}
                imageUrl={videoModel.imageUrl}
                originalUrl={videoModel.originalUrl}
                imageAlt={videoModel.imageAlt}
                category={videoModel.category}
                width={videoModel.width}
                height={videoModel.height}
                type={videoModel.type}
                duration={videoModel.duration}
                resolution={videoModel.resolution}
                onDelete={handleDeleteVideo}
                onNameUpdate={handleUpdateVideoName}
                isUploaded={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No videos uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Upload your first videos to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}