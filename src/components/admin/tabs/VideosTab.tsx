'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import AdminModelCard from '@/components/AdminModelCard'
import UploadProgressPanel from '@/components/admin/UploadProgressPanel'
import type { UploadProgressEvent } from '@/types'

export default function VideosTab() {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processedFiles, setProcessedFiles] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [fileProgress, setFileProgress] = useState(0)

  const {
    media,
    addMedia,
    removeMedia,
    loadMedia,
    updateCustomName,
    usingRailway,
    uploadQueue = [],
    overallProgress = 0,
    isClearingQueue = false,
    clearUploadQueue,
    clearUploadQueueByType
  } = useEnvironmentStore()

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
  }, [loadMedia, usingRailway])

  const videos = media.filter((item) => item.type === 'video')

  const handleProgress = useCallback((event: UploadProgressEvent) => {
      const { overallProgress, fileName, processed, total, fileProgress, status, error } = event
      setUploadProgress(Math.round(overallProgress))
      setCurrentFile(fileName)
      setProcessedFiles(processed)
      setTotalFiles(total)
      setFileProgress(Math.round(fileProgress))

      if (status === 'failed' && error) {
        console.error(`❌ ${fileName} 업로드 실패: ${error}`)
      }
    },
    []
  )

  const processVideoFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      setUploadProgress(0)
      setFileProgress(0)
      setProcessedFiles(0)
      setCurrentFile('')

      try {
        const videoFiles = Array.from(files).filter((file) => file.type.startsWith('video/'))

        if (videoFiles.length === 0) {
          alert('비디오(MP4) 파일을 선택해주세요.')
          setUploading(false)
          return
        }

        console.log(`🎥 비디오 업로드 시작: ${videoFiles.length}개`)
        setTotalFiles(videoFiles.length)

        await addMedia(videoFiles, { onProgress: handleProgress })

        setUploadProgress(100)
        setFileProgress(100)
        setProcessedFiles(videoFiles.length)
        setCurrentFile('완료')

        await loadMedia()
        setUploading(false)

        console.log('✅ 비디오 업로드 완료')
      } catch (error) {
        console.error('❌ 비디오 업로드 실패:', error)
        setUploading(false)
        setUploadProgress(0)
        setFileProgress(0)
        setProcessedFiles(0)
        setTotalFiles(0)
        setCurrentFile('')
        alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
    [addMedia, handleProgress, loadMedia]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const files = event.dataTransfer.files
      if (files.length > 0) processVideoFiles(files)
    },
    [processVideoFiles]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files) processVideoFiles(files)
    },
    [processVideoFiles]
  )

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('정말로 이 비디오를 삭제하시겠습니까?')) return
    try {
      await removeMedia(id)
      console.log('✅ 비디오 삭제 완료:', id)
    } catch (error) {
      console.error('❌ 비디오 삭제 실패:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const handleUpdateVideoName = async (id: string, newName: string) => {
    try {
      await updateCustomName(id, newName)
      console.log('✅ 비디오 이름 업데이트 완료:', id, newName)
      await loadMedia()
    } catch (error) {
      console.error('❌ 비디오 이름 업데이트 실패:', error)
      throw error
    }
  }

  const effectiveOverall = Math.max(uploadProgress, overallProgress)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Management</h2>
            <p className="text-gray-600">MP4 비디오를 업로드하고 썸네일과 메타데이터를 관리하세요.</p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <div className="text-purple-800 font-bold text-lg">{videos.length}</div>
            <div className="text-purple-600 text-sm">Videos</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Videos</h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-purple-600 space-y-2">
              <div className="relative w-28 h-28 mx-auto">
                <svg className="w-full h-full text-purple-200" viewBox="0 0 36 36">
                  <path
                    className="text-purple-100"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    opacity={0.3}
                  />
                  <path
                    className="text-purple-500"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${effectiveOverall}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-semibold">{effectiveOverall}%</span>
                </div>
              </div>

              <p className="font-medium text-center">비디오 업로드 중...</p>
              {currentFile && (
                <div className="text-sm text-gray-600 text-center space-y-1">
                  <p>현재 파일: <span className="font-medium text-gray-800">{currentFile}</span></p>
                  <p>파일 진행률: <span className="font-medium text-gray-800">{fileProgress}%</span></p>
                  <p>완료된 파일: <span className="font-medium text-gray-800">{processedFiles}/{totalFiles}</span></p>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">대용량 파일은 서버 처리에 시간이 더 걸릴 수 있습니다.</p>
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Video Files</p>
                <p className="text-sm text-gray-500">MP4 파일만 지원하며, 원본 화질을 유지합니다.</p>
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

        <div className="mt-4 bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎥 Supported Video Formats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-purple-700">
            <div>• MP4 (.mp4)</div>
            <div>• 무손실 원본 저장</div>
            <div>• 최대 500MB</div>
            <div>• 자동 메타데이터 기록</div>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <UploadProgressPanel
            queue={uploadQueue}
            overallProgress={effectiveOverall}
            onClear={() => clearUploadQueueByType ? clearUploadQueueByType('video') : clearUploadQueue?.()}
            isClearing={isClearingQueue}
            className="mt-6"
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video Library</h3>
            <p className="text-sm text-gray-600">업로드한 비디오 목록입니다.</p>
          </div>
          {videos.length > 0 && (
            <div className="text-sm text-gray-500">{videos.length} video{videos.length !== 1 ? 's' : ''}</div>
          )}
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((videoItem, index) => (
              <AdminModelCard
                key={videoItem.id}
                id={videoItem.id}
                name={(videoItem as any).customName || `비디오 #${index + 1}`}
                imageUrl={videoItem.url}
                originalUrl={videoItem.originalUrl}
                imageAlt={`Video: ${videoItem.fileName}`}
                category="uploaded"
                width={videoItem.width || 400}
                height={videoItem.height || 300}
                type={videoItem.type}
                duration={videoItem.duration}
                onDelete={handleDeleteVideo}
                onNameUpdate={handleUpdateVideoName}
                isUploaded
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">아직 업로드된 비디오가 없습니다.</h3>
            <p className="mt-1 text-sm text-gray-500">대용량 비디오도 원본 화질 그대로 저장됩니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
