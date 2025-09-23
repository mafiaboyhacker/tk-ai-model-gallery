'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import OptimizedImage from './OptimizedImage'
// import useMediaObjectUrl from '@/hooks/useMediaObjectUrl' // Not used in optimized version

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
  const [hasLoadError, setHasLoadError] = useState(false)
  const altText = imageAlt || name || 'AI 모델 갤러리 미디어'
  const normalizedImageUrl = (imageUrl ?? '').trim()

  // 실제 미디어 타입 감지: type 필드를 우선 신뢰, base64 비디오 데이터도 비디오로 처리
  const isActuallyVideo = type === 'video'

  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoInView, setIsVideoInView] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  // 단순화: 직접 URL 사용 (useMediaObjectUrl 우회)
  const resolvedVideoSource = useMemo(
    () => originalUrl || normalizedImageUrl,
    [normalizedImageUrl, originalUrl]
  )

  const modalImageSource = useMemo(
    () => originalUrl || normalizedImageUrl,
    [normalizedImageUrl, originalUrl]
  )

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    // 비디오인 경우 항상 모달 열기 (링크가 없으므로)
    // 이미지인 경우는 더 이상 이 핸들러를 사용하지 않음
    if (isActuallyVideo) {
      e.preventDefault()
      e.stopPropagation()
      setIsModalOpen(true)
    }
  }, [isActuallyVideo])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  useEffect(() => {
    if (!isActuallyVideo || isAdminMode || typeof window === 'undefined') {
      return
    }

    const currentCard = cardRef.current
    if (!currentCard) {
      return
    }

    // 🚀 Optimized intersection observer with better timing
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        const isIntersecting = entry?.isIntersecting ?? false
        const intersectionRatio = entry?.intersectionRatio ?? 0

        // Only trigger autoplay when 30% of video is visible
        // This reduces frequent start/stop during scroll
        setIsVideoInView(isIntersecting && intersectionRatio > 0.3)
      },
      {
        rootMargin: '50px 0px',  // Reduced from 200px for better control
        threshold: [0, 0.3, 0.7, 1.0]  // Multiple thresholds for fine control
      }
    )

    observer.observe(currentCard)

    return () => {
      observer.disconnect()
    }
  }, [isActuallyVideo, isAdminMode])

  useEffect(() => {
    if (!isActuallyVideo || isAdminMode) {
      return
    }

    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    let isComponentMounted = true

    if (isVideoInView) {
      // 🚀 Progressive video loading with better error handling
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        const playPromise = videoElement.play()
        if (playPromise) {
          playPromise
            .then(() => {
              if (isComponentMounted) {
                setIsVideoLoaded(true)
              }
            })
            .catch((error) => {
              // Graceful fallback for autoplay failures
              if (error.name === 'NotAllowedError') {
                console.log('Autoplay blocked, showing poster instead')
              }
            })
        }
      } else {
        // Wait for video to load enough data
        const handleCanPlay = () => {
          if (isComponentMounted && isVideoInView) {
            videoElement.play().catch(() => {})
            setIsVideoLoaded(true)
          }
        }
        videoElement.addEventListener('canplay', handleCanPlay, { once: true })
      }
    } else {
      videoElement.pause()
      setVideoProgress(videoElement.currentTime / videoElement.duration * 100 || 0)
    }

    return () => {
      isComponentMounted = false
      if (videoElement && !videoElement.paused) {
        videoElement.pause()
      }
    }
  }, [isActuallyVideo, isAdminMode, isVideoInView])


  // imageUrl이 빈 문자열이면 렌더링하지 않음
  if (!normalizedImageUrl) {
    return null
  }

  return (
    <>
      <div
        ref={cardRef}
        className="group relative overflow-hidden rounded-minimal bg-white shadow-sm hover:shadow-md transition-all duration-300"
        data-category={category ?? 'uncategorized'}
      >
        {isActuallyVideo ? (
          isAdminMode ? (
            // 어드민 모드: 썸네일 이미지 표시
            <div
              className="block relative overflow-hidden bg-gray-50 cursor-pointer group"
              onClick={handleImageClick}
            >
              <OptimizedImage
                src={normalizedImageUrl}
                alt={altText}
                width={width}
                height={height}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                loading="lazy"
                onError={() => {
                  setHasLoadError(true)
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Video thumbnail failed to load:', normalizedImageUrl)
                  }
                }}
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
            <Link
              href={`/model/${id}`}
              className="block relative overflow-hidden bg-white"
              aria-label={`${name || '모델'} 상세 보기`}
            >
              <div className="relative">
                {/* Video loading skeleton */}
                {!isVideoLoaded && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <div className="bg-gray-200 rounded-full p-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-sm animate-pulse" />
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  src={resolvedVideoSource}
                  autoPlay={false}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className={`w-full h-auto object-cover transition-all duration-300 group-hover:scale-105 ${
                    isVideoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement
                    setVideoProgress(video.currentTime / video.duration * 100 || 0)
                  }}
                  onError={() => {
                    setHasLoadError(true)
                    setIsVideoLoaded(false)
                    if (process.env.NODE_ENV === 'development') {
                      console.warn('Video failed to load:', resolvedVideoSource)
                    }
                  }}
                >
                  비디오를 재생할 수 없습니다.
                </video>

                {/* Progress indicator for videos */}
                {isVideoLoaded && videoProgress > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          )
        ) : (
          // 이미지인 경우 링크로 이동
          <Link
            href={`/model/${id}`}
            className="block relative overflow-hidden bg-gray-50"
            aria-label={`${name || '모델'} 상세 보기`}
          >
            <OptimizedImage
              src={normalizedImageUrl}
              alt={altText}
              width={width}
              height={height}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/Xw=="
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              onError={() => {
                setHasLoadError(true)
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Image failed to load:', normalizedImageUrl)
                }
              }}
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
                src={resolvedVideoSource}
                controls
                autoPlay
                className="w-full h-full max-w-full max-h-full object-contain rounded-lg"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh'
                }}
                onError={() => {
                  setHasLoadError(true)
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Video failed to load:', resolvedVideoSource)
                  }
                }}
                onLoadedMetadata={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('비디오 로드 완료:', resolvedVideoSource)
                  }
                }}
                preload="metadata"
              >
                비디오를 재생할 수 없습니다.
              </video>
            ) : (
              <OptimizedImage
                src={modalImageSource || originalUrl || normalizedImageUrl}
                alt={`${altText} (고화질 원본)`}
                width={width}
                height={height}
                className="max-w-full max-h-full object-contain"
                sizes="100vw"
                priority
                quality={95}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
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
