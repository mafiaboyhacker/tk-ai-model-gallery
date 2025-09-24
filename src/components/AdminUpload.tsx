'use client'

import { useState, useCallback } from 'react'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import UploadProgressPanel from '@/components/admin/UploadProgressPanel'
import type { UploadProgressEvent } from '@/types'

interface AdminUploadProps {
  isVisible: boolean
  onClose: () => void
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export default function AdminUpload({ isVisible, onClose }: AdminUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [totalFiles, setTotalFiles] = useState(0)
  const [processedFiles, setProcessedFiles] = useState(0)
  const [fileProgress, setFileProgress] = useState(0)

  const {
    addMedia,
    uploadQueue = [],
    overallProgress = 0
  } = useRailwayMediaStore()

  const handleProgressEvent = useCallback((event: UploadProgressEvent) => {
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

  const processFiles = useCallback(
    async (files: FileList) => {
      console.log('🔍 파일 업로드 시작 - 총 파일 수:', files.length)

      const fileArray = Array.from(files).filter((file) =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      )

      if (fileArray.length === 0) {
        alert('이미지(JPG, PNG, JPEG, WebP) 또는 비디오(MP4) 파일만 업로드 가능합니다.')
        return
      }

      fileArray.forEach((file, index) => {
        console.log(`📁 파일 ${index + 1}:`, {
          name: file.name,
          type: file.type,
          size: formatBytes(file.size),
          isImage: file.type.startsWith('image/'),
          isVideo: file.type.startsWith('video/')
        })
      })

      setUploading(true)
      setUploadProgress(0)
      setProcessedFiles(0)
      setCurrentFile('')
      setFileProgress(0)
      setTotalFiles(fileArray.length)

      try {
        await addMedia(fileArray, { onProgress: handleProgressEvent })

        setUploadProgress(100)
        setProcessedFiles(fileArray.length)
        setCurrentFile('완료!')
        setFileProgress(100)

        console.log(`✅ Railway 업로드 완료: ${fileArray.length}개 파일`)

        await new Promise((resolve) => setTimeout(resolve, 400))
        setUploading(false)
        onClose()
      } catch (error) {
        console.error('❌ Upload failed:', error)
        setUploading(false)
        setUploadProgress(0)
        setFileProgress(0)
        alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
    [addMedia, handleProgressEvent, onClose]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const files = event.dataTransfer.files
      if (files.length > 0) processFiles(files)
    },
    [processFiles]
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
      if (files) processFiles(files)
    },
    [processFiles]
  )

  if (!isVisible) return null

  const effectiveOverall = Math.max(uploadProgress, overallProgress)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Upload</h2>
            <p className="text-sm text-gray-500 mt-1">
              Railway Storage로 업로드합니다.
            </p>
          </div>
          <button
            onClick={() => {
              setUploading(false)
              onClose()
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-blue-600 space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${effectiveOverall}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{effectiveOverall}% 완료</span>
                  <span className="text-gray-600">
                    {processedFiles} / {totalFiles} 파일
                  </span>
                </div>

                {currentFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-700">📤 {currentFile}</span>
                      <span className="text-blue-600 font-bold">{fileProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${fileProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-2 pt-2 text-sm text-gray-600">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Railway Storage 업로드 중...</span>
                </div>
              </div>

              <UploadProgressPanel
                queue={uploadQueue}
                overallProgress={effectiveOverall}
                className="mt-4"
              />
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4 space-y-2">
                <svg className="w-12 h-12 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-900">업로드할 파일을 드래그 또는 선택하세요</p>
                <p className="text-sm text-gray-500">
                  지원 형식: 이미지(JPG, PNG, WebP) · 비디오(MP4)
                </p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleFileInput}
                className="hidden"
                id="admin-file-upload"
              />
              <label
                htmlFor="admin-file-upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block font-medium"
              >
                파일 선택하기
              </label>
            </>
          )}
        </div>

        {uploadQueue.length > 0 && !uploading && (
          <UploadProgressPanel
            queue={uploadQueue}
            overallProgress={effectiveOverall}
            className="mt-6"
          />
        )}
      </div>
    </div>
  )
}
