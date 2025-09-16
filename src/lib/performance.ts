/**
 * 성능 모니터링 및 최적화 시스템
 * Web Vitals, 리소스 모니터링, 성능 최적화 유틸리티
 */

import type { PerformanceMetrics, LoadingState } from '@/types'
import { PERFORMANCE_CONFIG } from './constants'

// 🎯 성능 메트릭 타입
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
}

interface ResourceTiming {
  name: string
  type: string
  size: number
  duration: number
  timing: {
    dns: number
    connect: number
    request: number
    response: number
  }
}

interface MemoryInfo {
  used: number
  total: number
  limit: number
  percentage: number
}

// 📊 성능 모니터링 클래스
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObservers()
    }
  }

  /**
   * 성능 관찰자 설정
   */
  private setupObservers(): void {
    try {
      // Long Task 관찰
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('🐌 Long Task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              })
            }
          }
        })

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
          this.observers.push(longTaskObserver)
        } catch (e) {
          console.log('Long Task API not supported')
        }

        // Resource Timing 관찰
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.analyzeResourceTiming(entry as PerformanceResourceTiming)
          }
        })

        try {
          resourceObserver.observe({ entryTypes: ['resource'] })
          this.observers.push(resourceObserver)
        } catch (e) {
          console.log('Resource Timing API not supported')
        }
      }
    } catch (error) {
      console.error('Performance observer setup failed:', error)
    }
  }

  /**
   * 리소스 타이밍 분석
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const timing: ResourceTiming = {
      name: entry.name,
      type: this.getResourceType(entry),
      size: entry.transferSize || 0,
      duration: entry.duration,
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        connect: entry.connectEnd - entry.connectStart,
        request: entry.responseStart - entry.requestStart,
        response: entry.responseEnd - entry.responseStart
      }
    }

    // 느린 리소스 경고
    if (timing.duration > 1000) {
      console.warn('🐌 Slow resource loading:', timing)
    }

    // 큰 리소스 경고
    if (timing.size > 1024 * 1024) { // 1MB
      console.warn('📦 Large resource detected:', timing)
    }
  }

  /**
   * 리소스 타입 확인
   */
  private getResourceType(entry: PerformanceResourceTiming): string {
    const url = new URL(entry.name)
    const extension = url.pathname.split('.').pop()?.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension || '')) {
      return 'image'
    }
    if (['mp4', 'webm', 'mov'].includes(extension || '')) {
      return 'video'
    }
    if (['js', 'mjs'].includes(extension || '')) {
      return 'script'
    }
    if (['css'].includes(extension || '')) {
      return 'stylesheet'
    }
    return 'other'
  }

  /**
   * Web Vitals 메트릭 수집
   */
  async collectWebVitals(): Promise<WebVitalsMetric[]> {
    if (typeof window === 'undefined') return []

    const vitals: WebVitalsMetric[] = []

    try {
      // Web Vitals 라이브러리 동적 임포트
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')

      getCLS((metric) => {
        vitals.push({
          name: 'CLS',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        })
      })

      getFID((metric) => {
        vitals.push({
          name: 'FID',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        })
      })

      getFCP((metric) => {
        vitals.push({
          name: 'FCP',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        })
      })

      getLCP((metric) => {
        vitals.push({
          name: 'LCP',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        })
      })

      getTTFB((metric) => {
        vitals.push({
          name: 'TTFB',
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        })
      })
    } catch (error) {
      console.warn('Web Vitals collection failed:', error)
    }

    return vitals
  }

  /**
   * 메모리 사용량 모니터링
   */
  getMemoryInfo(): MemoryInfo | null {
    if (typeof window === 'undefined') return null

    const memory = (performance as unknown as { memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }}).memory

    if (!memory) return null

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  /**
   * 현재 성능 메트릭 수집
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const startTime = performance.now()

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const memory = this.getMemoryInfo()

    const metrics: PerformanceMetrics = {
      loadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      renderTime: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      imageLoadTime: this.getAverageImageLoadTime(),
      apiResponseTime: this.getAverageApiResponseTime(),
      memoryUsage: memory?.used || 0,
      cacheHitRate: this.calculateCacheHitRate()
    }

    const endTime = performance.now()
    console.log(`⏱️ Performance metrics collected in ${endTime - startTime}ms`)

    this.metrics.push(metrics)
    return metrics
  }

  /**
   * 평균 이미지 로딩 시간 계산
   */
  private getAverageImageLoadTime(): number {
    const imageEntries = performance.getEntriesByType('resource')
      .filter(entry => this.getResourceType(entry as PerformanceResourceTiming) === 'image')

    if (imageEntries.length === 0) return 0

    const totalTime = imageEntries.reduce((sum, entry) => sum + entry.duration, 0)
    return totalTime / imageEntries.length
  }

  /**
   * 평균 API 응답 시간 계산
   */
  private getAverageApiResponseTime(): number {
    const apiEntries = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/api/'))

    if (apiEntries.length === 0) return 0

    const totalTime = apiEntries.reduce((sum, entry) => sum + entry.duration, 0)
    return totalTime / apiEntries.length
  }

  /**
   * 캐시 히트율 계산
   */
  private calculateCacheHitRate(): number {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    if (resourceEntries.length === 0) return 0

    const cacheHits = resourceEntries.filter(entry =>
      entry.transferSize === 0 && entry.decodedBodySize > 0
    ).length

    return (cacheHits / resourceEntries.length) * 100
  }

  /**
   * 성능 경고 확인
   */
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = []
    const memory = this.getMemoryInfo()

    // 메모리 사용량 경고
    if (memory && memory.percentage > 80) {
      warnings.push(`높은 메모리 사용량: ${memory.percentage.toFixed(1)}%`)
    }

    // 느린 이미지 로딩 경고
    const avgImageTime = this.getAverageImageLoadTime()
    if (avgImageTime > 2000) {
      warnings.push(`느린 이미지 로딩: 평균 ${avgImageTime.toFixed(0)}ms`)
    }

    // 느린 API 응답 경고
    const avgApiTime = this.getAverageApiResponseTime()
    if (avgApiTime > 1000) {
      warnings.push(`느린 API 응답: 평균 ${avgApiTime.toFixed(0)}ms`)
    }

    return warnings
  }

  /**
   * 모니터링 시작
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🚀 Performance monitoring started')

    // 주기적 메트릭 수집
    setInterval(() => {
      this.getCurrentMetrics()
      const warnings = this.checkPerformanceWarnings()
      if (warnings.length > 0) {
        console.warn('⚠️ Performance warnings:', warnings)
      }
    }, 30000) // 30초마다
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    console.log('🛑 Performance monitoring stopped')
  }

  /**
   * 성능 보고서 생성
   */
  generateReport(): {
    metrics: PerformanceMetrics[]
    summary: {
      avgLoadTime: number
      avgRenderTime: number
      avgImageTime: number
      avgApiTime: number
      memoryTrend: string
    }
    recommendations: string[]
  } {
    if (this.metrics.length === 0) {
      return {
        metrics: [],
        summary: {
          avgLoadTime: 0,
          avgRenderTime: 0,
          avgImageTime: 0,
          avgApiTime: 0,
          memoryTrend: 'No data'
        },
        recommendations: ['데이터가 충분하지 않습니다. 모니터링을 더 오래 실행해 주세요.']
      }
    }

    const summary = {
      avgLoadTime: this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length,
      avgRenderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
      avgImageTime: this.metrics.reduce((sum, m) => sum + m.imageLoadTime, 0) / this.metrics.length,
      avgApiTime: this.metrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / this.metrics.length,
      memoryTrend: this.analyzeMemoryTrend()
    }

    const recommendations = this.generateRecommendations(summary)

    return {
      metrics: [...this.metrics],
      summary,
      recommendations
    }
  }

  /**
   * 메모리 트렌드 분석
   */
  private analyzeMemoryTrend(): string {
    if (this.metrics.length < 2) return 'Insufficient data'

    const recent = this.metrics.slice(-5)
    const trend = recent[recent.length - 1].memoryUsage - recent[0].memoryUsage

    if (trend > 1024 * 1024) return 'Increasing'
    if (trend < -1024 * 1024) return 'Decreasing'
    return 'Stable'
  }

  /**
   * 성능 개선 권장사항 생성
   */
  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = []

    if (summary.avgLoadTime > 3000) {
      recommendations.push('페이지 로딩 시간이 깁니다. 이미지 최적화를 고려해 보세요.')
    }

    if (summary.avgImageTime > 2000) {
      recommendations.push('이미지 로딩 시간을 개선하세요. WebP 형식 사용을 권장합니다.')
    }

    if (summary.avgApiTime > 500) {
      recommendations.push('API 응답 시간이 깁니다. 캐싱 또는 API 최적화를 고려해 보세요.')
    }

    if (summary.memoryTrend === 'Increasing') {
      recommendations.push('메모리 사용량이 증가하고 있습니다. 메모리 누수를 확인해 보세요.')
    }

    if (recommendations.length === 0) {
      recommendations.push('성능이 양호합니다. 현재 상태를 유지해 주세요.')
    }

    return recommendations
  }
}

// 🎯 성능 최적화 유틸리티

/**
 * 이미지 지연 로딩 구현
 */
export function createLazyLoader(threshold = 100): IntersectionObserver | null {
  if (typeof window === 'undefined') return null

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const dataSrc = img.getAttribute('data-src')

          if (dataSrc) {
            img.src = dataSrc
            img.removeAttribute('data-src')
          }
        }
      })
    },
    {
      rootMargin: `${threshold}px`
    }
  )
}

/**
 * 디바운스 함수 (성능 최적화)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 스로틀 함수 (성능 최적화)
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

/**
 * 이미지 프리로딩
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url =>
      new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
      })
    )
  )
}

/**
 * 중요 리소스 프리로딩
 */
export function preloadCriticalResources(resources: { href: string; as: string; type?: string }[]): void {
  if (typeof document === 'undefined') return

  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    document.head.appendChild(link)
  })
}

/**
 * 메모리 정리 유틸리티
 */
export function cleanupMemory(): void {
  if (typeof window === 'undefined') return

  // URL 객체 정리
  if ('URL' in window && 'revokeObjectURL' in URL) {
    // 기존 생성된 URL 객체들 정리는 각 컴포넌트에서 처리
  }

  // 가비지 컬렉션 힌트 (Chrome DevTools에서만 작동)
  if ('gc' in window && typeof window.gc === 'function') {
    window.gc()
  }
}

/**
 * 번들 크기 분석
 */
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

  console.group('📦 Bundle Analysis')

  scripts.forEach((script: Element) => {
    const src = script.getAttribute('src')
    if (src) {
      console.log('Script:', src)
    }
  })

  styles.forEach((style: Element) => {
    const href = style.getAttribute('href')
    if (href) {
      console.log('Stylesheet:', href)
    }
  })

  console.groupEnd()
}

// 🎯 전역 성능 모니터 인스턴스
export const performanceMonitor = new PerformanceMonitor()

// 개발 환경에서 성능 모니터링 자동 시작
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring()
  ;(window as unknown as { performanceMonitor: PerformanceMonitor }).performanceMonitor = performanceMonitor
}

export default performanceMonitor