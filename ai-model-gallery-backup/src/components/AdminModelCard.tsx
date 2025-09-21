'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import OptimizedImage from './OptimizedImage'

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
  onNameUpdate?: (id: string, newName: string) => Promise<void>  // 이름 편집 함수
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
  onNameUpdate,
  isUploaded = false,
  type = 'image',
  duration,
  resolution
}: AdminModelCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  // name prop이 변경되면 editName 상태도 업데이트
  useEffect(() => {
    setEditName(name)
  }, [name])

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

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // 이름 편집 관련 함수들
  const handleEditStart = () => {
    console.log('✏️ 편집 시작:', { currentName: name, editName })
    setEditName(name)
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    console.log('🔄 handleEditSave 시작:', { id, editName: editName.trim(), onNameUpdate: !!onNameUpdate })

    if (editName.trim() && onNameUpdate) {
      try {
        console.log('📝 이름 업데이트 시도:', { id, newName: editName.trim() })
        await onNameUpdate(id, editName.trim())
        setIsEditing(false)
        console.log('✅ AdminModelCard: Name updated successfully')
      } catch (error) {
        console.error('❌ AdminModelCard: Failed to update name:', error)
        // 실패시 원래 이름으로 복원
        setEditName(name)
      }
    } else {
      console.log('⚠️ 업데이트 조건 미충족:', {
        editNameTrim: editName.trim(),
        hasOnNameUpdate: !!onNameUpdate
      })
    }
  }

  const handleEditCancel = () => {
    setEditName(name)
    setIsEditing(false)
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
              src={originalUrl || imageUrl}
              width={width}
              height={height}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              muted
              playsInline
              onError={(e) => {
                console.error('Video failed to load:', originalUrl || imageUrl, e)
              }}
            >
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Video not available</span>
              </div>
            </video>
          ) : (
            <OptimizedImage
              src={imageUrl}
              alt={imageAlt}
              width={width}
              height={height}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                console.error('Image failed to load:', imageUrl)
              }}
              loading="lazy"
            />
          )}
        </Link>

        {/* Media Info */}
        <div className="p-2">
          {/* 이름 편집 기능 (어드민 전용) */}
          {isEditing ? (
            <div className="flex items-center gap-1 mb-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-1 py-0.5 flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleEditSave()
                  if (e.key === 'Escape') handleEditCancel()
                }}
                autoFocus
                onBlur={handleEditCancel}
              />
              <button
                onClick={handleEditSave}
                className="text-green-600 hover:text-green-800 p-0.5"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleEditCancel}
                className="text-gray-600 hover:text-gray-800 p-0.5"
                title="Cancel"
              >
                ✗
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate flex-1">{name}</h3>
              {onNameUpdate && (
                <button
                  onClick={handleEditStart}
                  className="text-gray-400 hover:text-gray-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit name"
                >
                  ✏️
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{width}×{height}</span>
            {type === 'video' && resolution && (
              <span className="text-purple-600">{resolution}</span>
            )}
          </div>
          {category && category !== 'uploaded' && (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
              type === 'video'
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
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
              <OptimizedImage
                src={originalUrl || imageUrl}
                alt={`${imageAlt} (고화질 원본)`}
                width={width}
                height={height}
                className="max-w-full max-h-full object-contain"
                sizes="100vw"
                priority
                quality={95}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
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
