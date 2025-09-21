'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

/**
 * 모바일 최적화 이미지 컴포넌트
 *
 * 특징:
 * - WebP 포맷 우선 지원
 * - Progressive Loading
 * - 모바일 해상도 최적화
 * - Lazy Loading with Intersection Observer
 * - 스켈레톤 로딩 효과
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 479px) 50vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw',
  style,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // 50px 전에 미리 로드
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // 이미지 로드 완료 처리
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // 이미지 로드 에러 처리
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // 최적화된 이미지 URL 생성
  const getOptimizedSrc = (originalSrc: string): string => {
    // 모바일 디바이스 확인
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // 모바일용 해상도 계산
    const mobileWidth = isMobile ? Math.min(400, (window.innerWidth / 2) * devicePixelRatio) : 800;

    // WebP 지원 확인
    const supportsWebP = typeof window !== 'undefined' &&
      document.createElement('canvas').toDataURL('image/webp').indexOf('webp') > -1;

    // 이미지 최적화 파라미터
    const params = new URLSearchParams();
    params.set('w', mobileWidth.toString());
    params.set('q', '85'); // 품질 85%
    if (supportsWebP) {
      params.set('f', 'webp');
    }

    // URL에 파라미터 추가 (이미지 최적화 서비스 사용 시)
    if (originalSrc.includes('?')) {
      return `${originalSrc}&${params.toString()}`;
    } else {
      return `${originalSrc}?${params.toString()}`;
    }
  };

  // 스켈레톤 로딩 컴포넌트
  const SkeletonLoader = () => (
    <div
      className={`image-skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        ...style
      }}
    />
  );

  // 에러 플레이스홀더
  const ErrorPlaceholder = () => (
    <div
      className={`bg-gray-200 flex items-center justify-center ${className}`}
      style={{
        width: width || '100%',
        height: height || 200,
        ...style
      }}
    >
      <div className="text-gray-400 text-center">
        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <p className="text-sm">이미지를 불러올 수 없습니다</p>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {!isInView ? (
        <SkeletonLoader />
      ) : hasError ? (
        <ErrorPlaceholder />
      ) : (
        <div className="relative">
          {/* 스켈레톤 로딩 (이미지 로딩 중) */}
          {isLoading && <SkeletonLoader />}

          {/* 최적화된 이미지 */}
          <Image
            src={getOptimizedSrc(src)}
            alt={alt}
            width={width}
            height={height}
            className={`
              model-image
              image-progressive
              ${isLoading ? 'loading' : 'loaded'}
              ${className}
            `}
            style={{
              ...style,
              opacity: isLoading ? 0 : 1
            }}
            sizes={sizes}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            quality={85}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;