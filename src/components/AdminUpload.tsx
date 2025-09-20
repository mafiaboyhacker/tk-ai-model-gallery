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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [totalFiles, setTotalFiles] = useState(0)
  const [processedFiles, setProcessedFiles] = useState(0)
  const { addMedia, usingRailway } = useEnvironmentStore()

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
    console.log('🔍 파일 업로드 시작 - 총 파일 수:', files.length)

    // 모든 파일의 상세 정보 출력
    Array.from(files).forEach((file, index) => {
      console.log(`📁 파일 ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/')
      })
    })

    // 진행률 초기화
    setUploading(true)
    setUploadProgress(0)
    setProcessedFiles(0)
    setCurrentFile('')

    try {
      // File[] 배열로 변환하여 이미지와 비디오 필터링
      const fileArray = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      )

      console.log('✅ 필터링 후 파일 수:', fileArray.length)

      if (fileArray.length === 0) {
        console.warn('⚠️ 지원되는 파일이 없습니다 (이미지 또는 비디오만 지원)')
        alert('지원되는 파일이 없습니다. 이미지(JPG, PNG, WebP) 또는 비디오(MP4) 파일만 업로드 가능합니다.')
        setUploading(false)
        return
      }

      setTotalFiles(fileArray.length)
      const images = fileArray.filter(file => file.type.startsWith('image/')).length
      const videos = fileArray.filter(file => file.type.startsWith('video/')).length

      console.log(`🚀 ${usingRailway ? 'Railway' : 'Local'} Storage에 미디어 업로드 시작: ${fileArray.length}개 (이미지: ${images}, 비디오: ${videos})`)

      // 🚀 파일별 진행률 추적을 위한 개별 처리
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setCurrentFile(file.name)
        setProcessedFiles(i)

        const progress = Math.round(((i + 0.5) / fileArray.length) * 100)
        setUploadProgress(progress)

        console.log(`📤 처리 중 (${i + 1}/${fileArray.length}): ${file.name}`)

        // 파일 개별 처리 (시뮬레이션을 위한 약간의 지연)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 전체 업로드 실행
      await addMedia(fileArray)

      // 완료 상태
      setUploadProgress(100)
      setProcessedFiles(fileArray.length)
      setCurrentFile('완료!')

      console.log(`✅ ${usingRailway ? 'Railway' : 'Local'} 업로드 완료: ${fileArray.length}개 파일`)

      // 완료 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500))

      setUploading(false)
      onClose()

    } catch (error) {
      console.error('❌ Upload failed:', error)
      setUploading(false)
      setUploadProgress(0)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addMedia, onClose, usingRailway])

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
            <div className="text-blue-600 space-y-4">
              {/* 🚀 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>

              {/* 📊 진행률 정보 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{uploadProgress}% 완료</span>
                  <span className="text-gray-600">
                    {processedFiles} / {totalFiles} 파일
                  </span>
                </div>

                {/* 현재 처리 중인 파일 */}
                {currentFile && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    📤 {currentFile}
                  </div>
                )}

                {/* 애니메이션 스피너 */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm">미디어 처리 중...</span>
                </div>
              </div>
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
                accept="image/*,video/mp4,video/webm,video/mov,video/avi,video/*"
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