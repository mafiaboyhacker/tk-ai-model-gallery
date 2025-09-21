'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// 🚀 Performance Metrics 인터페이스
export interface PerformanceMetrics {
  // 📊 로딩 성능
  pageLoadTime: number
  dataLoadTime: number
  renderTime: number

  // 🖼️ 이미지 성능
  imageLoadCount: number
  imageErrorCount: number
  averageImageLoadTime: number

  // 💾 메모리 사용량
  memoryUsage?: number

  // 🌐 네트워크 성능
  networkRequests: number
  networkErrors: number

  // 🎯 Core Web Vitals (웹 생태 핵심 지표)
  firstContentfulPaint?: number  // FCP
  largestContentfulPaint?: number // LCP
  firstInputDelay?: number        // FID
  cumulativeLayoutShift?: number  // CLS

  // 📱 반응형 성능
  responsiveBreakpoints: string[]
  currentBreakpoint: string

  // 🔄 갤러리 성능
  galleryItemCount: number
  virtualizedItems?: number
  renderEfficiency: number
}

// 🚀 Performance Metrics Hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    dataLoadTime: 0,
    renderTime: 0,
    imageLoadCount: 0,
    imageErrorCount: 0,
    averageImageLoadTime: 0,
    networkRequests: 0,
    networkErrors: 0,
    responsiveBreakpoints: ['mobile', 'tablet', 'desktop', 'xl'],
    currentBreakpoint: 'desktop',
    galleryItemCount: 0,
    renderEfficiency: 100
  })

  const [isCollecting, setIsCollecting] = useState(false)
  const startTimeRef = useRef<number>(0)
  const imageLoadTimesRef = useRef<number[]>([])
  const renderStartRef = useRef<number>(0)

  // 📊 경량화된 Core Web Vitals 측정
  const measureCoreWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return

    // 🚀 최소 오버헤드로 측정
    try {
      // 기본 Navigation Timing만 사용 (가장 가벼움)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigationEntry) {
        const loadComplete = navigationEntry.loadEventEnd - navigationEntry.navigationStart

        setMetrics(prev => ({
          ...prev,
          pageLoadTime: Math.max(prev.pageLoadTime, loadComplete) // 기존값과 비교해서 더 큰 값 사용
        }))
      }

      // 🔧 Performance Observer는 선택적으로만 사용 (리소스 절약)
      if ('PerformanceObserver' in window && window.innerWidth > 768) { // 데스크탑에서만
        // FCP 빠른 측정
        const paintEntries = performance.getEntriesByType('paint')
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime

        if (fcp) {
          setMetrics(prev => ({
            ...prev,
            firstContentfulPaint: fcp
          }))
        }

        // LCP는 3초 후 자동 disconnect (메모리 절약)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1] as any

            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime
            }))

            // 첫 측정 후 바로 disconnect
            lcpObserver.disconnect()
          }
        })

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // 3초 후 강제 disconnect
        setTimeout(() => {
          try {
            lcpObserver.disconnect()
          } catch (e) {
            // 이미 disconnect된 경우 무시
          }
        }, 3000)
      }
    } catch (error) {
      // 에러 로깅도 최소화
      if (process.env.NODE_ENV === 'development') {
        console.warn('Core Web Vitals 측정 실패:', error)
      }
    }
  }, [])

  // 🖼️ 이미지 로딩 성능 추적
  const trackImageLoad = useCallback((loadTime: number, success: boolean = true) => {
    if (success) {
      imageLoadTimesRef.current.push(loadTime)

      setMetrics(prev => {
        const newImageLoadCount = prev.imageLoadCount + 1
        const totalLoadTime = imageLoadTimesRef.current.reduce((sum, time) => sum + time, 0)
        const averageLoadTime = totalLoadTime / imageLoadTimesRef.current.length

        return {
          ...prev,
          imageLoadCount: newImageLoadCount,
          averageImageLoadTime: averageLoadTime
        }
      })
    } else {
      setMetrics(prev => ({
        ...prev,
        imageErrorCount: prev.imageErrorCount + 1
      }))
    }
  }, [])

  // 💾 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory

      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB 단위
      }))
    }
  }, [])

  // 📱 반응형 브레이크포인트 감지
  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    let breakpoint = 'mobile'

    if (width >= 1280) breakpoint = 'xl'
    else if (width >= 1024) breakpoint = 'desktop'
    else if (width >= 768) breakpoint = 'tablet'
    else breakpoint = 'mobile'

    setMetrics(prev => ({
      ...prev,
      currentBreakpoint: breakpoint
    }))
  }, [])

  // 🔄 갤러리 성능 측정
  const updateGalleryMetrics = useCallback((itemCount: number, virtualizedItems?: number) => {
    const efficiency = virtualizedItems ?
      Math.min(100, (virtualizedItems / itemCount) * 100) :
      itemCount <= 50 ? 100 : Math.max(50, 100 - ((itemCount - 50) * 0.5))

    setMetrics(prev => ({
      ...prev,
      galleryItemCount: itemCount,
      virtualizedItems,
      renderEfficiency: efficiency
    }))
  }, [])

  // 🌐 네트워크 요청 추적
  const trackNetworkRequest = useCallback((success: boolean = true) => {
    setMetrics(prev => ({
      ...prev,
      networkRequests: prev.networkRequests + 1,
      networkErrors: success ? prev.networkErrors : prev.networkErrors + 1
    }))
  }, [])

  // 📊 데이터 로딩 시간 측정
  const startDataLoad = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  const endDataLoad = useCallback(() => {
    if (startTimeRef.current > 0) {
      const loadTime = performance.now() - startTimeRef.current
      setMetrics(prev => ({
        ...prev,
        dataLoadTime: loadTime
      }))
      startTimeRef.current = 0
    }
  }, [])

  // 🔍 세밀한 단계별 성능 측정 (13개 파일 병목 분석용)
  const measureDetailedTiming = useCallback((step: string, startTime: number) => {
    const duration = performance.now() - startTime
    console.log(`⏱️ [${step}]: ${Math.round(duration)}ms`)
    return duration
  }, [])

  // 🎯 개별 파일 로딩 시간 측정
  const trackFileLoad = useCallback((fileName: string, startTime: number, fileType: 'image' | 'video') => {
    const duration = performance.now() - startTime
    console.log(`📁 [${fileType.toUpperCase()}] ${fileName}: ${Math.round(duration)}ms`)
    return duration
  }, [])

  // 🚀 API 호출 시간 측정
  const trackApiCall = useCallback((apiName: string, startTime: number) => {
    const duration = performance.now() - startTime
    console.log(`🌐 [API] ${apiName}: ${Math.round(duration)}ms`)
    return duration
  }, [])

  // 🎯 렌더링 성능 측정
  const startRender = useCallback(() => {
    renderStartRef.current = performance.now()
  }, [])

  const endRender = useCallback(() => {
    if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current
      setMetrics(prev => ({
        ...prev,
        renderTime: renderTime
      }))
      renderStartRef.current = 0
    }
  }, [])

  // 📈 성능 등급 계산
  const getPerformanceGrade = useCallback((metrics: PerformanceMetrics): string => {
    let score = 100

    // 페이지 로딩 시간 평가 (0-30점)
    if (metrics.pageLoadTime > 3000) score -= 30
    else if (metrics.pageLoadTime > 2000) score -= 20
    else if (metrics.pageLoadTime > 1000) score -= 10

    // 데이터 로딩 시간 평가 (0-20점)
    if (metrics.dataLoadTime > 2000) score -= 20
    else if (metrics.dataLoadTime > 1000) score -= 10

    // 이미지 로딩 성능 평가 (0-20점)
    const imageErrorRate = metrics.imageLoadCount > 0 ?
      (metrics.imageErrorCount / metrics.imageLoadCount) * 100 : 0
    if (imageErrorRate > 10) score -= 20
    else if (imageErrorRate > 5) score -= 10

    // Core Web Vitals 평가 (0-20점)
    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 4000) score -= 20
    else if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) score -= 10

    // 렌더링 효율성 평가 (0-10점)
    if (metrics.renderEfficiency < 70) score -= 10
    else if (metrics.renderEfficiency < 85) score -= 5

    if (score >= 90) return 'A+ 🚀 탁월'
    if (score >= 80) return 'A ⚡ 우수'
    if (score >= 70) return 'B ✅ 양호'
    if (score >= 60) return 'C 🏃 보통'
    return 'D ⚠️ 개선 필요'
  }, [])

  // 🚀 경량화된 초기화 (성능 최적화)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 🔧 성능 영향 최소화: 지연 초기화
    const initTimer = setTimeout(() => {
      setIsCollecting(true)

      // 기본 메트릭만 즉시 측정
      updateBreakpoint()

      // Core Web Vitals는 5초 지연 후 측정 (페이지 로딩 완료 후)
      setTimeout(() => {
        measureCoreWebVitals()
      }, 5000)

      // 메모리 측정은 더 긴 간격으로 (10초)
      const memoryInterval = setInterval(() => {
        // 페이지가 백그라운드일 때는 측정 중단
        if (!document.hidden) {
          measureMemoryUsage()
        }
      }, 10000)

      // 윈도우 리사이즈는 debounce 처리
      let resizeTimeout: NodeJS.Timeout
      const debouncedResize = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(updateBreakpoint, 150)
      }
      window.addEventListener('resize', debouncedResize)

      // 페이지 가시성 변경 시 측정 중단/재개
      const handleVisibilityChange = () => {
        setIsCollecting(!document.hidden)
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        clearInterval(memoryInterval)
        clearTimeout(resizeTimeout)
        window.removeEventListener('resize', debouncedResize)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, 1000) // 1초 지연으로 초기 로딩 방해 최소화

    return () => clearTimeout(initTimer)
  }, [measureCoreWebVitals, updateBreakpoint, measureMemoryUsage])

  return {
    metrics,
    isCollecting,

    // 측정 함수들
    trackImageLoad,
    updateGalleryMetrics,
    trackNetworkRequest,
    startDataLoad,
    endDataLoad,
    startRender,
    endRender,

    // 🔍 새로운 세밀한 측정 함수들 (13개 파일 병목 분석용)
    measureDetailedTiming,
    trackFileLoad,
    trackApiCall,

    // 분석 함수들
    getPerformanceGrade: () => getPerformanceGrade(metrics),

    // 유틸리티
    resetMetrics: () => {
      imageLoadTimesRef.current = []
      setMetrics({
        pageLoadTime: 0,
        dataLoadTime: 0,
        renderTime: 0,
        imageLoadCount: 0,
        imageErrorCount: 0,
        averageImageLoadTime: 0,
        networkRequests: 0,
        networkErrors: 0,
        responsiveBreakpoints: ['mobile', 'tablet', 'desktop', 'xl'],
        currentBreakpoint: 'desktop',
        galleryItemCount: 0,
        renderEfficiency: 100
      })
    }
  }
}