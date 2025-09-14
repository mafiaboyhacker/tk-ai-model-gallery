'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'

interface AdminModelCardProps {
  id: string
  name: string
  imageUrl: string      // 썸네일 URL (갤러리용)
  originalUrl?: string  // 원본 URL (모달용)
  imageAlt: string
  category?: string
  width: number
  height: number
  onDelete: (id: string) => void
  isUploaded?: boolean
  type?: 'image' | 'video'  // 미디어 타입
  duration?: number         // 비디오 재생시간
  resolution?: string       // 비디오 해상도
}

export default function AdminModelCard({
  id,
  name,
  imageUrl,
  originalUrl,
  imageAlt,
  category,
  width,
  height,
  onDelete,
  isUploaded = false,
  type = 'image',
  duration,
  resolution
}: AdminModelCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 단순화된 이미지 URL (캐시 버스팅 제거)
  const cacheBustedImageUrl = useMemo(() => {
    return imageUrl
  }, [imageUrl])
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(id)
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'A' && !(e.target as HTMLElement).closest('button')) {
      setIsModalOpen(true)
    }
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // imageUrl이 빈 문자열이면 렌더링하지 않음
  if (!imageUrl || imageUrl.trim() === '') {
    return null
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-minimal bg-white shadow-sm hover:shadow-md transition-all duration-300">
        {/* Delete Button - 업로드된 이미지만 */}
        {isUploaded && (
          <div className="absolute top-2 right-2 z-10">
            {!showDeleteConfirm ? (
              <button
                onClick={handleDeleteClick}
                className="bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200"
                title="Delete image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="bg-white rounded-lg p-2 shadow-lg border">
                <p className="text-xs text-gray-600 mb-2">Delete?</p>
                <div className="flex space-x-1">
                  <button
                    onClick={handleConfirmDelete}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Badge - 업로드된 미디어 표시 */}
        {isUploaded && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
              {type === 'video' ? '🎥 Video' : '📷 Image'}
            </span>
          </div>
        )}

        {/* 비디오 재생시간 표시 */}
        {type === 'video' && duration && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <Link href={`/model/${id}`} className="block relative overflow-hidden bg-gray-50">
          {type === 'video' ? (
            <video
              src={imageUrl}
              width={width}
              height={height}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              muted
              playsInline
              onError={(e) => {
                console.error('Video failed to load:', imageUrl, e)
              }}
            >
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Video not available</span>
              </div>
            </video>
          ) : (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={width}
              height={height}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl, e)
              }}
              unoptimized
            />
          )}
        </Link>

        {/* Media Info */}
        <div className="p-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{width}×{height}</span>
            {type === 'video' && resolution && (
              <span className="text-purple-600">{resolution}</span>
            )}
          </div>
          {category && category !== 'uploaded' && (
            <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 mt-1">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-4xl max-h-full">
            {type === 'video' ? (
              <video
                src={originalUrl || imageUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh'
                }}
              >
                비디오를 재생할 수 없습니다.
              </video>
            ) : (
              <Image
                src={originalUrl || imageUrl}  // 모달에서는 원본 사용, 없으면 썸네일
                alt={`${imageAlt} (고화질 원본)`}
                width={width}
                height={height}
                className="max-w-full max-h-full object-contain"
                unoptimized
              />
            )}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}