'use client'

import { useState, useCallback } from 'react'
import { useMediaStore } from '@/store/imageStore'

export default function AdminUploadSection() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ processed: number; total: number } | null>(null)
  const addMedia = useMediaStore((state) => state.addMedia)

  const processFiles = useCallback(async (files: FileList) => {
    setUploading(true)
    setUploadProgress({ processed: 0, total: files.length })

    try {
      // File[] 배열로 변환하여 이미지와 비디오 필터링
      const fileArray = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      )

      const images = fileArray.filter(file => file.type.startsWith('image/')).length
      const videos = fileArray.filter(file => file.type.startsWith('video/')).length

      console.log(`🚀 Admin: 미디어 업로드 시작 - ${fileArray.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // MediaDB 기반 미디어 저장
      await addMedia(fileArray)

      setUploading(false)
      setUploadProgress(null)

      console.log('✅ Admin: 업로드 완료')

    } catch (error) {
      console.error('❌ Admin: 업로드 실패:', error)
      setUploading(false)
      setUploadProgress(null)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addMedia])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

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
      processFiles(files)
    }
  }, [processFiles])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {uploading ? (
          <div className="text-blue-600">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-medium">Processing media files...</p>
            {uploadProgress && (
              <p className="text-sm text-gray-600 mt-2">
                Processing {uploadProgress.processed} of {uploadProgress.total} files
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="text-gray-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Images & Videos</p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
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
              Select Media Files
            </label>
          </>
        )}
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">📷 Image Formats</h4>
          <ul className="text-green-700 space-y-1">
            <li>• JPEG (.jpg, .jpeg)</li>
            <li>• PNG (.png)</li>
            <li>• WebP conversion automatic</li>
            <li>• Thumbnail generation included</li>
          </ul>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎥 Video Formats</h4>
          <ul className="text-purple-700 space-y-1">
            <li>• MP4 (.mp4)</li>
            <li>• Automatic thumbnail extraction</li>
            <li>• Duration detection</li>
            <li>• Resolution information</li>
          </ul>
        </div>
      </div>

      {/* Upload Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Upload Tips</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• You can upload multiple files at once (images and videos together)</li>
          <li>• Files are automatically optimized for web display</li>
          <li>• Videos will show play icons and duration in the gallery</li>
          <li>• All media is stored safely in your browser's IndexedDB</li>
        </ul>
      </div>
    </div>
  )
}