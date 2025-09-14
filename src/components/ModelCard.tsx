'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface ModelCardProps {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string  // 원본 URL (모달용)
  imageAlt: string
  category?: string
  width: number
  height: number
  type?: 'image' | 'video'  // 미디어 타입
  duration?: number         // 비디오 재생 시간 (초)
  resolution?: string       // 비디오 해상도
  isAdminMode?: boolean     // 어드민 모드 여부 (썸네일 vs 자동재생)
}

export default function ModelCard({
  id,
  name,
  imageUrl,
  originalUrl,
  imageAlt,
  category,
  width,
  height,
  type = 'image',
  duration,
  resolution,
  isAdminMode = false
}: ModelCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // imageUrl이 빈 문자열이면 렌더링하지 않음
  if (!imageUrl || imageUrl.trim() === '') {
    return null
  }

  // 실제 미디어 타입 감지: base64 이미지 데이터는 항상 이미지로 처리
  const isActuallyVideo = type === 'video' && !imageUrl.startsWith('data:image/')

  const handleImageClick = (e: React.MouseEvent) => {
    // 비디오인 경우 항상 모달 열기 (링크가 없으므로)
    // 이미지인 경우는 더 이상 이 핸들러를 사용하지 않음
    if (isActuallyVideo) {
      e.preventDefault()
      e.stopPropagation()
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-minimal bg-white shadow-sm hover:shadow-md transition-all duration-300">
        {isActuallyVideo ? (
          isAdminMode ? (
            // 어드민 모드: 썸네일 이미지 표시
            <div
              className="block relative overflow-hidden bg-gray-50 cursor-pointer group"
              onClick={handleImageClick}
            >
              <Image
                src={imageUrl} // 비디오 썸네일 사용
                alt={imageAlt}
                width={width}
                height={height}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  console.error('Video thumbnail failed to load:', imageUrl, e)
                }}
                unoptimized
              />

              {/* 비디오 표시 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-3 group-hover:bg-black/80 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* 미드저니 스타일: 호버시에만 재생시간 표시 */}
              {duration && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          ) : (
            // 메인 갤러리 모드: 비디오 자동재생
            <Link href={`/model/${id}`} className="block relative overflow-hidden bg-white">
              <video
                src={imageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.error('Video failed to load:', imageUrl, e)
                }}
              >
                비디오를 재생할 수 없습니다.
              </video>
            </Link>
          )
        ) : (
          // 이미지인 경우 링크로 이동
          <Link href={`/model/${id}`} className="block relative overflow-hidden bg-gray-50">
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
          </Link>
        )}
      </div>

      {/* 미디어 모달 (이미지/비디오 통합) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않음
          >
            {isActuallyVideo ? (
              <video
                src={originalUrl || imageUrl}
                controls
                autoPlay
                className="w-full h-full max-w-full max-h-full object-contain rounded-lg"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh'
                }}
                onError={(e) => {
                  console.error('Video failed to load:', originalUrl || imageUrl, e)
                }}
                onLoadedMetadata={(e) => {
                  console.log('비디오 로드 완료:', originalUrl || imageUrl)
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

            {/* 닫기 버튼 - 모바일에서도 잘 보이도록 개선 */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-xl sm:text-2xl hover:text-gray-300 transition-colors z-50 bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
            >
              ×
            </button>

            {/* 비디오 정보 표시 - 모바일에서도 잘 보이도록 개선 */}
            {isActuallyVideo && (duration || resolution) && (
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/75 text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 rounded max-w-[200px] sm:max-w-none">
                {duration && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                {resolution && (
                  <div className="flex items-center space-x-1 mt-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <span>{resolution}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}