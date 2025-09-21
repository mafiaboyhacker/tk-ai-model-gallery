/**
 * 모바일 성능 최적화 유틸리티
 *
 * 목표:
 * - 모바일 LCP < 2.5초
 * - 모바일 CLS < 0.1
 * - 번들 크기 < 500KB
 * - 이미지 로딩 < 1초
 */

// 디바이스 감지
export const detectDevice = () => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const userAgent = navigator.userAgent;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent) && width >= 768;

  if (width < 480) return 'mobile-small';
  if (width < 768) return 'mobile-large';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// 연결 상태 감지
export const getConnectionType = (): string => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  return connection.effectiveType || 'unknown';
};

// 이미지 최적화 URL 생성
export const generateOptimizedImageUrl = (
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    dpr?: number;
  } = {}
): string => {
  const {
    width = 400,
    quality = 85,
    format = 'webp',
    dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  } = options;

  const targetWidth = Math.round(width * dpr);
  const params = new URLSearchParams();

  params.set('w', targetWidth.toString());
  params.set('q', quality.toString());
  params.set('f', format);

  if (src.includes('?')) {
    return `${src}&${params.toString()}`;
  }
  return `${src}?${params.toString()}`;
};

// WebP 지원 확인
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// AVIF 지원 확인
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => resolve(avif.height === 2);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// 최적 이미지 포맷 결정
export const getBestImageFormat = async (): Promise<'avif' | 'webp' | 'jpg'> => {
  if (await supportsAVIF()) return 'avif';
  if (await supportsWebP()) return 'webp';
  return 'jpg';
};

// 모바일 뷰포트 설정
export const setMobileViewport = () => {
  if (typeof document === 'undefined') return;

  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }

  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
  );
};

// 성능 메트릭 측정
export class PerformanceMonitor {
  private static observers: PerformanceObserver[] = [];

  // Core Web Vitals 측정
  static measureCoreWebVitals(callback: (metric: {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }) => void) {
    // LCP (Largest Contentful Paint) 측정
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const lcp = entry.startTime;
          callback({
            name: 'LCP',
            value: lcp,
            rating: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
          });
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // CLS (Cumulative Layout Shift) 측정
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            callback({
              name: 'CLS',
              value: entry.value,
              rating: entry.value <= 0.1 ? 'good' : entry.value <= 0.25 ? 'needs-improvement' : 'poor'
            });
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // FID (First Input Delay) 측정
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          callback({
            name: 'FID',
            value: fid,
            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }
  }

  // 이미지 로딩 성능 측정
  static measureImageLoading(callback: (metrics: {
    src: string;
    loadTime: number;
    size: number;
  }) => void) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.initiatorType === 'img') {
            callback({
              src: entry.name,
              loadTime: entry.duration,
              size: entry.transferSize || 0
            });
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // 메모리 사용량 측정 (Chrome만 지원)
  static measureMemoryUsage(): number | null {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return null;
  }

  // 모든 observer 정리
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 모바일 터치 최적화
export const optimizeTouchInteraction = () => {
  if (typeof document === 'undefined') return;

  // 300ms 클릭 지연 제거
  const style = document.createElement('style');
  style.textContent = `
    * {
      touch-action: manipulation;
    }

    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }

    .touch-feedback:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
};

// 리소스 힌트 추가
export const addResourceHints = (urls: string[]) => {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    // DNS prefetch
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = new URL(url).origin;
    document.head.appendChild(dnsPrefetch);

    // Preconnect for same origin
    if (new URL(url).origin === window.location.origin) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = url;
      document.head.appendChild(preconnect);
    }
  });
};

// 중요한 이미지 preload
export const preloadCriticalImages = (urls: string[]) => {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

// 번들 크기 분석
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  return {
    scriptCount: scripts.length,
    styleCount: styles.length,
    estimatedSize: scripts.length * 50 + styles.length * 20 // KB 추정
  };
};

// 모바일 성능 최적화 초기화
export const initMobileOptimization = async () => {
  // 뷰포트 설정
  setMobileViewport();

  // 터치 최적화
  optimizeTouchInteraction();

  // 성능 모니터링 시작
  PerformanceMonitor.measureCoreWebVitals((metric) => {
    console.log(`[Performance] ${metric.name}: ${metric.value}ms (${metric.rating})`);
  });

  PerformanceMonitor.measureImageLoading((metrics) => {
    console.log(`[Image Loading] ${metrics.src}: ${metrics.loadTime}ms (${metrics.size} bytes)`);
  });

  // 최적 이미지 포맷 감지
  const bestFormat = await getBestImageFormat();
  console.log(`[Image Format] Best supported format: ${bestFormat}`);

  return {
    device: detectDevice(),
    connection: getConnectionType(),
    bestImageFormat: bestFormat
  };
};