'use client'

import Image, { ImageProps } from 'next/image'
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: ImageProps['placeholder']
  blurDataURL?: string
  sizes?: string
  style?: CSSProperties
  onLoad?: () => void
  onError?: () => void
  quality?: number
  loading?: ImageProps['loading']
}

const DEFAULT_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'
const DEFAULT_QUALITY = 85
const MAX_DPR = 2

const isDataUrl = (value: string) => value.startsWith('data:')

let cachedSupportsWebp: boolean | null = null

const detectWebpSupport = () => {
  if (cachedSupportsWebp !== null) {
    return cachedSupportsWebp
  }

  if (typeof window === 'undefined') {
    return null
  }

  const canvas = document.createElement('canvas')
  const canUseWebp = !!(canvas.getContext && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0)
  cachedSupportsWebp = canUseWebp
  return cachedSupportsWebp
}

const buildOptimizedSrc = (
  original: string,
  width?: number,
  quality: number = DEFAULT_QUALITY,
  supportsWebp?: boolean | null
) => {
  if (isDataUrl(original) || typeof window === 'undefined') {
    return original
  }

  // API 경로인 경우 파라미터 추가하지 않고 그대로 반환
  if (original.includes('/api/railway/storage/file/')) {
    console.log('🖼️ API 경로 감지, 최적화 건너뛰기:', original)
    return original
  }

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const targetWidth = Math.max(Math.round((width || 800) * dpr), 320)

  const params = new URLSearchParams()
  params.set('w', targetWidth.toString())
  params.set('q', quality.toString())
  if (supportsWebp) {
    params.set('f', 'webp')
  }

  const separator = original.includes('?') ? '&' : '?'
  return `${original}${separator}${params.toString()}`
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = DEFAULT_SIZES,
  style,
  onLoad,
  onError,
  quality = DEFAULT_QUALITY,
  loading
}: OptimizedImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(priority)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const supportsWebp = typeof window === 'undefined' ? null : detectWebpSupport()

  useEffect(() => {
    if (!priority) {
      const currentContainer = containerRef.current
      if (currentContainer) {
        // 🚀 Progressive loading with better intersection detection
        const observer = new IntersectionObserver(
          entries => {
            const entry = entries[0]
            if (entry?.isIntersecting) {
              setIsInView(true)
              observer.disconnect()
            }
          },
          {
            rootMargin: '150px 0px',  // Slightly increased for smoother loading
            threshold: 0.1  // Start loading when 10% visible
          }
        )

        observer.observe(currentContainer)
        return () => observer.disconnect()
      }
    } else {
      setIsInView(true)
    }
  }, [priority])

  useEffect(() => {
    // Reset loading states if src changes
    setIsLoading(true)
    setHasError(false)
  }, [src])

  const skeletonStyle: CSSProperties = useMemo(() => {
    const aspectRatio = width && height ? width / height : undefined

    return {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : aspectRatio ? undefined : 'auto',
      aspectRatio: aspectRatio ? `${width}/${height}` : undefined,
      ...style
    }
  }, [height, style, width])

  const handleLoad = () => {
    setIsLoading(false)
    setLoadProgress(100)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const placeholderNode = (
    <div
      className={`bg-gray-100 animate-pulse relative overflow-hidden ${className}`}
      style={skeletonStyle}
    >
      {/* Enhanced shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />

      {/* Loading progress bar */}
      {isLoading && loadProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}
    </div>
  )

  const optimizedSrc = useMemo(
    () => (isInView ? buildOptimizedSrc(src, width, quality, supportsWebp) : src),
    [isInView, quality, src, supportsWebp, width]
  )

  if (!isInView) {
    return (
      <div ref={containerRef} className="relative overflow-hidden">
        {placeholderNode}
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`bg-gray-200 flex items-center justify-center text-gray-500 ${className}`}
        style={skeletonStyle}
      >
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs">이미지를 불러올 수 없습니다</span>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {isLoading && placeholderNode}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-all duration-300 ease-out ${
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        }`}
        style={style}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={() => setLoadProgress(10)}
        onProgress={() => setLoadProgress(50)}
        quality={quality}
        loading={loading || (priority ? 'eager' : 'lazy')}
        decoding="async"
      />
    </div>
  )
}

export default OptimizedImage
