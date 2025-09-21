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

const buildOptimizedSrc = (
  original: string,
  width?: number,
  quality: number = DEFAULT_QUALITY,
  supportsWebp?: boolean
) => {
  if (isDataUrl(original) || typeof window === 'undefined') {
    return original
  }

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const targetWidth = Math.max( Math.round((width || 800) * dpr), 320)

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
  const [supportsWebp, setSupportsWebp] = useState<boolean | null>(null)
  const [optimizedSrc, setOptimizedSrc] = useState(src)

  useEffect(() => {
    if (!priority && containerRef.current) {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        { rootMargin: '120px' }
      )

      observer.observe(containerRef.current)
      return () => observer.disconnect()
    } else {
      setIsInView(true)
    }
  }, [priority])

  useEffect(() => {
    if (supportsWebp !== null || typeof document === 'undefined') {
      return
    }

    const canvas = document.createElement('canvas')
    const canUseWebp = canvas.getContext && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    setSupportsWebp(canUseWebp)
  }, [supportsWebp])

  useEffect(() => {
    if (!isInView) return

    setOptimizedSrc(buildOptimizedSrc(src, width, quality, supportsWebp ?? undefined))
  }, [isInView, quality, src, supportsWebp, width])

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
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const placeholderNode = (
    <div
      className={`bg-gray-100 animate-pulse ${className}`}
      style={skeletonStyle}
    />
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
        <span className="text-xs">이미지를 불러올 수 없습니다</span>
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
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={style}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        quality={quality}
        loading={loading || (priority ? 'eager' : 'lazy')}
        decoding="async"
      />
    </div>
  )
}

export default OptimizedImage
