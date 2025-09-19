'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import AdminModelCard from '@/components/AdminModelCard'

export default function ImagesTab() {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { media, addMedia, removeMedia, loadMedia, updateCustomName, usingRailway } = useEnvironmentStore()

  // 컴포넌트 마운트시 미디어 로드
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log(`🔄 이미지 탭: ${usingRailway ? 'Railway' : 'Local'}에서 미디어 로드 중...`)
        await loadMedia()
      } catch (error) {
        console.error(`❌ 이미지 탭: ${usingRailway ? 'Railway' : 'Local'} 로드 실패:`, error)
      }
    }

    initializeMedia()
  }, [loadMedia])

  // 이미지만 필터링
  const images = media.filter(item => item.type === 'image')

  // 이미지 데이터를 ModelCard 형식으로 변환
  const imageModels = images.map((imageItem, index) => ({
    id: imageItem.id,
    name: (imageItem as any).customName || `이미지 #${index + 1}`,
    imageUrl: imageItem.url,
    originalUrl: imageItem.originalUrl,
    imageAlt: `Image: ${imageItem.fileName}`,
    category: 'uploaded',
    width: imageItem.width || 400,
    height: imageItem.height || 400,
    type: imageItem.type
  }))

  const processImageFiles = useCallback(async (files: FileList) => {
    setUploading(true)

    try {
      // 이미지 파일만 필터링
      const imageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/')
      )

      if (imageFiles.length === 0) {
        alert('Please select valid image files (JPG, PNG, JPEG, WebP)')
        setUploading(false)
        return
      }

      console.log(`🖼️ 이미지 업로드 시작: ${imageFiles.length}개`)

      await addMedia(imageFiles)

      setUploading(false)
      console.log('✅ 이미지 업로드 완료')

    } catch (error) {
      console.error('❌ 이미지 업로드 실패:', error)
      setUploading(false)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addMedia])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processImageFiles(files)
    }
  }, [processImageFiles])

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
      processImageFiles(files)
    }
  }, [processImageFiles])

  const handleDeleteImage = async (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        await removeMedia(id)
        console.log('✅ 이미지 삭제 완료:', id)
      } catch (error) {
        console.error('❌ 이미지 삭제 실패:', error)
        alert('Failed to delete image. Please try again.')
      }
    }
  }

  const handleUpdateImageName = async (id: string, newName: string) => {
    try {
      await updateCustomName(id, newName)
      console.log('✅ 이미지 이름 업데이트 완료:', id, newName)
      // 이름 업데이트 후 미디어 다시 로드하여 UI 동기화
      await loadMedia()
    } catch (error) {
      console.error('❌ 이미지 이름 업데이트 실패:', error)
      throw error // AdminModelCard에서 에러 처리
    }
  }

  return (
    <div className="space-y-6">
      {/* Images Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Image Management</h2>
            <p className="text-gray-600">
              Upload and manage image files. Supports JPG, PNG, JPEG, and WebP formats.
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <div className="text-green-800 font-bold text-lg">{imageModels.length}</div>
            <div className="text-green-600 text-sm">Images</div>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Images</h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="text-green-600">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-medium">Processing images...</p>
            </div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Image Files</p>
                <p className="text-sm text-gray-500">
                  Drag and drop image files here, or click to select
                </p>
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

        {/* Supported Formats */}
        <div className="mt-4 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">📷 Supported Image Formats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700">
            <div>• JPEG (.jpg, .jpeg)</div>
            <div>• PNG (.png)</div>
            <div>• WebP (.webp)</div>
            <div>• Automatic optimization</div>
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Image Gallery</h3>
            <p className="text-sm text-gray-600">
              All uploaded images with management options
            </p>
          </div>
          {imageModels.length > 0 && (
            <div className="text-sm text-gray-500">
              {imageModels.length} image{imageModels.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {imageModels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imageModels.map((imageModel) => (
              <AdminModelCard
                key={imageModel.id}
                id={imageModel.id}
                name={imageModel.name}
                imageUrl={imageModel.imageUrl}
                originalUrl={imageModel.originalUrl}
                imageAlt={imageModel.imageAlt}
                category={imageModel.category}
                width={imageModel.width}
                height={imageModel.height}
                type={imageModel.type}
                onDelete={handleDeleteImage}
                onNameUpdate={handleUpdateImageName}
                isUploaded={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No images uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Upload your first images to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}