'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRailwayMediaStore } from '@/store/railwayMediaStore'
import AdminModelCard from '@/components/AdminModelCard'
import UploadProgressPanel from '@/components/admin/UploadProgressPanel'
import type { UploadProgressEvent } from '@/types'

export default function ImagesTab() {
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
    uploadQueue = [],
    overallProgress = 0,
    isClearingQueue = false,
    clearUploadQueue,
    clearUploadQueueByType
  } = useRailwayMediaStore()

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log('🔄 이미지 탭: Railway에서 미디어 로드 중...')
        await loadMedia()
      } catch (error) {
        console.error('❌ 이미지 탭: Railway 로드 실패:', error)
      }
    }

    initializeMedia()
  }, [loadMedia])

  const images = media.filter((item) => item.type === 'image')

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

  const processImageFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      setUploadProgress(0)
      setFileProgress(0)
      setProcessedFiles(0)
      setCurrentFile('')

      try {
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))

        if (imageFiles.length === 0) {
          alert('이미지(JPG, PNG, JPEG, WebP) 파일을 선택해주세요.')
          setUploading(false)
          return
        }

        console.log(`🖼️ 이미지 업로드 시작: ${imageFiles.length}개`)
        setTotalFiles(imageFiles.length)

        await addMedia(imageFiles, { onProgress: handleProgress })

        setUploadProgress(100)
        setFileProgress(100)
        setProcessedFiles(imageFiles.length)
        setCurrentFile('완료')

        await loadMedia()
        setUploading(false)

        console.log('✅ 이미지 업로드 완료')
      } catch (error) {
        console.error('❌ 이미지 업로드 실패:', error)
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
      if (files.length > 0) processImageFiles(files)
    },
    [processImageFiles]
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
      if (files) processImageFiles(files)
    },
    [processImageFiles]
  )

  const handleDeleteImage = async (id: string) => {
    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) return
    try {
      await removeMedia(id)
      console.log('✅ 이미지 삭제 완료:', id)
    } catch (error) {
      console.error('❌ 이미지 삭제 실패:', error)
      alert('Failed to delete image. Please try again.')
    }
  }

  const handleUpdateImageName = async (id: string, newName: string) => {
    try {
      await updateCustomName(id, newName)
      console.log('✅ 이미지 이름 업데이트 완료:', id, newName)
      await loadMedia()
    } catch (error) {
      console.error('❌ 이미지 이름 업데이트 실패:', error)
      throw error
    }
  }

  const effectiveOverall = Math.max(uploadProgress, overallProgress)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Image Management</h2>
            <p className="text-gray-600">이미지(JPG, PNG, WebP)를 업로드하고 관리하세요.</p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <div className="text-green-800 font-bold text-lg">{images.length}</div>
            <div className="text-green-600 text-sm">Images</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Images</h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-green-600 space-y-2">
              <div className="relative w-28 h-28 mx-auto">
                <svg className="w-full h-full text-green-200" viewBox="0 0 36 36">
                  <path
                    className="text-green-100"
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
                    className="text-green-500"
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

              <p className="font-medium text-center">이미지 업로드 중...</p>
              {currentFile && (
                <div className="text-sm text-gray-600 text-center space-y-1">
                  <p>현재 파일: <span className="font-medium text-gray-800">{currentFile}</span></p>
                  <p>파일 진행률: <span className="font-medium text-gray-800">{fileProgress}%</span></p>
                  <p>완료된 파일: <span className="font-medium text-gray-800">{processedFiles}/{totalFiles}</span></p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Image Files</p>
                <p className="text-sm text-gray-500">드래그 앤 드롭하거나 클릭하여 파일을 선택하세요.</p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="image-file-upload"
              />
              <label
                htmlFor="image-file-upload"
                className="bg-green-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-green-700 transition-colors inline-block font-medium"
              >
                Select Image Files
              </label>
            </>
          )}
        </div>

        <div className="mt-4 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">📷 Supported Image Formats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700">
            <div>• JPEG (.jpg, .jpeg)</div>
            <div>• PNG (.png)</div>
            <div>• WebP (.webp)</div>
            <div>• 무손실 원본 보존</div>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <UploadProgressPanel
            queue={uploadQueue}
            overallProgress={effectiveOverall}
            onClear={() => clearUploadQueueByType ? clearUploadQueueByType('image') : clearUploadQueue?.()}
            isClearing={isClearingQueue}
            className="mt-6"
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Image Gallery</h3>
            <p className="text-sm text-gray-600">업로드한 이미지 목록입니다.</p>
          </div>
          {images.length > 0 && (
            <div className="text-sm text-gray-500">{images.length} image{images.length !== 1 ? 's' : ''}</div>
          )}
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((imageItem, index) => (
              <AdminModelCard
                key={imageItem.id}
                id={imageItem.id}
                name={(imageItem as any).customName || `이미지 #${index + 1}`}
                imageUrl={imageItem.url}
                originalUrl={imageItem.originalUrl}
                imageAlt={`Image: ${imageItem.fileName}`}
                category="uploaded"
                width={imageItem.width || 400}
                height={imageItem.height || 400}
                type={imageItem.type}
                onDelete={handleDeleteImage}
                onNameUpdate={handleUpdateImageName}
                isUploaded
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">아직 업로드된 이미지가 없습니다.</h3>
            <p className="mt-1 text-sm text-gray-500">이미지를 업로드하여 갤러리를 채워보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
