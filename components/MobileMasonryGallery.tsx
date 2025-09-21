'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OptimizedImage from './OptimizedImage';

/**
 * 모바일 최적화 Masonry 갤러리 컴포넌트
 *
 * 특징:
 * - 모바일: 2열 고정 레이아웃
 * - 태블릿: 3열 레이아웃
 * - 데스크톱: 4-6열 레이아웃 (기존 유지)
 * - Midjourney 스타일 가변 크기 지원
 * - 터치 친화적 인터랙션
 * - 무한 스크롤 지원
 */

interface ModelData {
  id: string;
  name: {
    ko: string;
    en: string;
  };
  imageUrl: string;
  thumbnailUrl: string;
  aspectRatio: number;
  category: string[];
  slug: string;
}

interface MobileMasonryGalleryProps {
  models: ModelData[];
  onModelClick?: (model: ModelData) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

const MobileMasonryGallery: React.FC<MobileMasonryGalleryProps> = ({
  models,
  onModelClick,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = ''
}) => {
  const [columns, setColumns] = useState(2);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [itemPositions, setItemPositions] = useState<Map<string, {
    column: number;
    top: number;
    height: number;
  }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // 화면 크기에 따른 컬럼 수 계산
  const calculateColumns = useCallback(() => {
    if (typeof window === 'undefined') return 2;

    const width = window.innerWidth;

    if (width < 480) return 2;      // 모바일 Small
    if (width < 768) return 2;      // 모바일 Large
    if (width < 1024) return 3;     // 태블릿
    if (width < 1440) return 4;     // 데스크톱
    if (width < 1920) return 5;     // 대형 화면
    return 6;                       // 초대형 화면
  }, []);

  // 컬럼 수 업데이트
  useEffect(() => {
    const updateColumns = () => {
      const newColumns = calculateColumns();
      if (newColumns !== columns) {
        setColumns(newColumns);
        setColumnHeights(new Array(newColumns).fill(0));
        setItemPositions(new Map());
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns, calculateColumns]);

  // Masonry 레이아웃 계산
  const calculateLayout = useCallback(() => {
    if (!containerRef.current || columns === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const gap = columns <= 2 ? 8 : columns <= 3 ? 12 : 16;
    const columnWidth = (containerWidth - (gap * (columns - 1))) / columns;

    const newColumnHeights = new Array(columns).fill(0);
    const newPositions = new Map();

    models.forEach((model) => {
      // 가장 짧은 컬럼 찾기
      const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights));

      // 이미지 높이 계산
      const imageHeight = columnWidth * (model.aspectRatio || 1.2);
      const cardPadding = columns <= 2 ? 32 : 40; // 텍스트 영역
      const totalHeight = imageHeight + cardPadding;

      // 위치 정보 저장
      newPositions.set(model.id, {
        column: shortestColumnIndex,
        top: newColumnHeights[shortestColumnIndex],
        height: totalHeight
      });

      // 컬럼 높이 업데이트
      newColumnHeights[shortestColumnIndex] += totalHeight + gap;
    });

    setColumnHeights(newColumnHeights);
    setItemPositions(newPositions);
  }, [models, columns]);

  // 레이아웃 재계산
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // 무한 스크롤 설정
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // 모델 카드 클릭 핸들러
  const handleModelClick = (model: ModelData) => {
    // 터치 피드백 애니메이션
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50); // 햅틱 피드백
    }
    onModelClick?.(model);
  };

  // 컨테이너 높이 계산
  const containerHeight = Math.max(...columnHeights);

  return (
    <div className={`w-full ${className}`}>
      {/* Masonry 컨테이너 */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: containerHeight }}
      >
        {models.map((model) => {
          const position = itemPositions.get(model.id);
          if (!position) return null;

          const gap = columns <= 2 ? 8 : columns <= 3 ? 12 : 16;
          const containerWidth = containerRef.current?.clientWidth || 0;
          const columnWidth = (containerWidth - (gap * (columns - 1))) / columns;
          const left = position.column * (columnWidth + gap);

          return (
            <div
              key={model.id}
              className="absolute cursor-pointer model-card touch-feedback layout-optimized"
              style={{
                left: `${left}px`,
                top: `${position.top}px`,
                width: `${columnWidth}px`,
                height: `${position.height}px`
              }}
              onClick={() => handleModelClick(model)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModelClick(model);
                }
              }}
              aria-label={`${model.name.ko} 모델 상세보기`}
            >
              {/* 이미지 */}
              <div className="relative overflow-hidden rounded-lg">
                <OptimizedImage
                  src={model.thumbnailUrl || model.imageUrl}
                  alt={model.name.ko}
                  width={columnWidth}
                  height={columnWidth * (model.aspectRatio || 1.2)}
                  className="w-full h-auto object-cover"
                  sizes={`${columnWidth}px`}
                />
              </div>

              {/* 모델 정보 */}
              <div className={`p-${columns <= 2 ? '2' : '3'}`}>
                <h3 className={`
                  font-medium text-gray-800 leading-tight
                  ${columns <= 2 ? 'text-mobile-xs' : 'text-mobile-sm'}
                `}>
                  {model.name.ko}
                </h3>
                {model.name.en && (
                  <p className={`
                    text-gray-500 mt-1
                    ${columns <= 2 ? 'text-mobile-xs' : 'text-mobile-sm'}
                  `}>
                    {model.name.en}
                  </p>
                )}
              </div>

              {/* 호버/터치 효과 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 hover:bg-opacity-10 rounded-lg" />
            </div>
          );
        })}
      </div>

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* 무한 스크롤 관찰자 */}
      {hasMore && !isLoading && (
        <div ref={observerRef} className="h-4" />
      )}

      {/* 끝 메시지 */}
      {!hasMore && models.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            모든 모델을 확인했습니다
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileMasonryGallery;