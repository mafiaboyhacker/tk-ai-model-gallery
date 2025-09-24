'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import OptimizedImage from './OptimizedImage'

interface SafeModelCardProps {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string
  imageAlt: string
  category?: string
  width: number
  height: number
  type?: 'image' | 'video'
  duration?: number
  resolution?: string
  isAdminMode?: boolean
}

/**
 * 🛡️ Safe version of ModelCard with Chrome stability fixes
 * - Reduced intersection observer complexity
 * - Throttled video events
 * - Memory leak prevention
 */
export default function SafeModelCard({
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
}: SafeModelCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const altText = imageAlt || name || 'AI 모델 갤러리 미디어'
  const normalizedImageUrl = (imageUrl ?? '').trim()

  const isActuallyVideo = type === 'video'
  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoInView, setIsVideoInView] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const resolvedVideoSource = useMemo(
    () => originalUrl || normalizedImageUrl,
    [normalizedImageUrl, originalUrl]
  )

  const modalImageSource = useMemo(
    () => originalUrl || normalizedImageUrl,
    [normalizedImageUrl, originalUrl]
  )

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (isActuallyVideo) {
      e.preventDefault()
      e.stopPropagation()
      setIsModalOpen(true)
    }
  }, [isActuallyVideo])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // 🛡️ Simplified intersection observer for Chrome stability
  useEffect(() => {
    if (!isActuallyVideo || isAdminMode || typeof window === 'undefined') {
      return
    }

    const currentCard = cardRef.current
    if (!currentCard) {
      return
    }

    let timeoutId: NodeJS.Timeout | null = null

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return

        // Debounce to prevent rapid state changes
        if (timeoutId) clearTimeout(timeoutId)

        timeoutId = setTimeout(() => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.5
          setIsVideoInView(isVisible)
        }, 150)
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.5 // Single threshold for stability
      }
    )

    observer.observe(currentCard)

    return () => {
      observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isActuallyVideo, isAdminMode])

  // 🛡️ Safe video autoplay with error handling
  useEffect(() => {
    if (!isActuallyVideo || isAdminMode) {
      return
    }

    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    if (isVideoInView) {
      // Simple play attempt without complex readyState checks
      videoElement.play().catch(() => {
        // Silent fail for autoplay restrictions
      })
    } else {
      videoElement.pause()
    }
  }, [isActuallyVideo, isAdminMode, isVideoInView])

  if (!normalizedImageUrl) {
    return null
  }

  return (
    <>
      <div
        ref={cardRef}
        className="group relative overflow-hidden rounded-minimal bg-white shadow-sm"
        data-category={category ?? 'uncategorized'}
      >
        {isActuallyVideo ? (
          isAdminMode ? (
            // Admin mode: thumbnail only
            <div
              className="block relative overflow-hidden bg-gray-50 cursor-pointer group"
              onClick={handleImageClick}
            >
              <OptimizedImage
                src={normalizedImageUrl}
                alt={altText}
                width={width}
                height={height}
                className="w-full h-auto object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                loading="lazy"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {duration && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-80">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          ) : (
            // Gallery mode: simplified video
            <Link
              href={`/model/${id}`}
              className="block relative overflow-hidden bg-white"
              aria-label={`${name || '모델'} 상세 보기`}
            >
              <div className="relative">
                {!isVideoLoaded && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <div className="bg-gray-200 rounded-full p-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-sm" />
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
                  className={`w-full h-auto object-cover transition-opacity duration-300 ${
                    isVideoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onError={() => {
                    console.log(`⚠️ 비디오 로딩 실패: ${resolvedVideoSource}`)
                    setIsVideoLoaded(false)
                  }}
                >
                  비디오를 재생할 수 없습니다.
                </video>
              </div>
            </Link>
          )
        ) : (
          // Image: simple link
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
              placeholder="empty"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          </Link>
        )}
      </div>

      {/* Simplified modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isActuallyVideo ? (
              <video
                src={resolvedVideoSource}
                controls
                autoPlay
                className="w-full h-full max-w-full max-h-full object-contain"
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
              />
            )}

            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white text-2xl bg-black/70 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// 🚀 Performance: Memoized component with prop comparison
const MemorizedSafeModelCard = memo(SafeModelCard, (prevProps, nextProps) => {
  // Core props comparison for performance
  return (
    prevProps.id === nextProps.id &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.originalUrl === nextProps.originalUrl &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.type === nextProps.type &&
    prevProps.isAdminMode === nextProps.isAdminMode
  )
})

MemorizedSafeModelCard.displayName = 'SafeModelCard'

export default MemorizedSafeModelCard