'use client'

import { useState, useCallback } from 'react'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

interface AdminUploadProps {
  isVisible: boolean
  onClose: () => void
}

export default function AdminUpload({ isVisible, onClose }: AdminUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { addMedia, usingSupabase } = useEnvironmentStore()

  const generateRandomSize = () => {
    // Midjourney style random sizes
    const sizes = [
      { width: 300, height: 400 }, // Portrait
      { width: 400, height: 300 }, // Landscape  
      { width: 350, height: 350 }, // Square
      { width: 280, height: 420 }, // Tall
      { width: 450, height: 280 }, // Wide
      { width: 320, height: 380 }, // Slight portrait
      { width: 380, height: 320 }, // Slight landscape
    ]
    return sizes[Math.floor(Math.random() * sizes.length)]
  }

  const processFiles = useCallback(async (files: FileList) => {
    setUploading(true)

    try {
      // File[] 배열로 변환하여 이미지와 비디오 필터링
      const fileArray = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      )

      const images = fileArray.filter(file => file.type.startsWith('image/')).length
      const videos = fileArray.filter(file => file.type.startsWith('video/')).length

      console.log(`🚀 ${usingSupabase ? 'Supabase' : 'Local'} Storage에 미디어 업로드 시작: ${fileArray.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // Environment Store가 자동으로 적절한 스토어 선택 (로컬: IndexedDB, 배포: Supabase)
      await addMedia(fileArray)

      console.log(`✅ ${usingSupabase ? 'Supabase' : 'Local'} 업로드 완료: ${fileArray.length}개 파일`)

      setUploading(false)
      onClose()

    } catch (error) {
      console.error('❌ Upload failed:', error)
      setUploading(false)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addMedia, onClose])

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

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Upload</h2>
          <button 
            onClick={onClose}
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
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-blue-600">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Processing media...</p>
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Drag & Drop Images & Videos</p>
                <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, MP4 files</p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block"
              >
                Select Media Files
              </label>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Press <kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + U</kbd> to toggle this panel
        </p>
      </div>
    </div>
  )
}