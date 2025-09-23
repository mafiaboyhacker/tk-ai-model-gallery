'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseVideoIntersectionOptions {
  rootMargin?: string
  threshold?: number | number[]
  minimumVisibilityRatio?: number
  playDelay?: number
  pauseDelay?: number
}

interface UseVideoIntersectionReturn {
  ref: React.RefObject<HTMLElement>
  isInView: boolean
  isPlaying: boolean
  intersectionRatio: number
}

/**
 * 🚀 Optimized video intersection hook for better autoplay control
 * Reduces video start/stop frequency during scrolling
 */
export function useVideoIntersection({
  rootMargin = '50px 0px',
  threshold = [0, 0.3, 0.7, 1.0],
  minimumVisibilityRatio = 0.3,
  playDelay = 100,
  pauseDelay = 200
}: UseVideoIntersectionOptions = {}): UseVideoIntersectionReturn {
  const ref = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)

  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimeouts = useCallback(() => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element || typeof window === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const isIntersecting = entry.isIntersecting
        const ratio = entry.intersectionRatio

        setIntersectionRatio(ratio)
        setIsInView(isIntersecting)

        clearTimeouts()

        if (isIntersecting && ratio >= minimumVisibilityRatio) {
          // Video is sufficiently visible - schedule play
          playTimeoutRef.current = setTimeout(() => {
            setIsPlaying(true)
          }, playDelay)
        } else {
          // Video is not visible enough - schedule pause
          pauseTimeoutRef.current = setTimeout(() => {
            setIsPlaying(false)
          }, pauseDelay)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      clearTimeouts()
    }
  }, [rootMargin, threshold, minimumVisibilityRatio, playDelay, pauseDelay, clearTimeouts])

  // Cleanup on unmount
  useEffect(() => {
    return clearTimeouts
  }, [clearTimeouts])

  return {
    ref,
    isInView,
    isPlaying,
    intersectionRatio
  }
}