# 미드저니 스타일 이미지 갤러리 구현 가이드

## 📋 개요

미드저니 explore 페이지의 **가변 크기 이미지 배치 시스템**을 분석하여, 다양한 사이즈의 이미지를 아름답게 배치하는 웹 갤러리 구현 방법을 제시합니다.

## 🎨 미드저니 레이아웃 분석 결과

### 핵심 배치 원리
1. **Masonry Layout (Pinterest 스타일)**
2. **고정 너비 + 가변 높이** 시스템
3. **이미지 비율 유지**하면서 자연스러운 배치
4. **무한 스크롤** 지원

### 이미지 크기 패턴
```yaml
image_patterns:
  portrait: "세로형 (2:3, 3:4 비율)"
  landscape: "가로형 (4:3, 16:9 비율)" 
  square: "정사방형 (1:1 비율)"
  tall: "매우 긴 세로형 (1:2 이상)"
```

## 🏗️ 기술 구현 방법

### 1. CSS Grid + Masonry 접근법

```css
/* 기본 그리드 컨테이너 */
.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 20px; /* 작은 단위로 설정 */
  gap: 16px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 이미지 카드 */
.gallery-item {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: #f8f9fa;
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* 이미지 */
.gallery-item img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* 동적 높이 계산 */
.gallery-item[data-height="small"] {
  grid-row-end: span 10; /* 200px */
}

.gallery-item[data-height="medium"] {
  grid-row-end: span 15; /* 300px */
}

.gallery-item[data-height="large"] {
  grid-row-end: span 20; /* 400px */
}

.gallery-item[data-height="tall"] {
  grid-row-end: span 25; /* 500px */
}

/* 반응형 설정 */
@media (max-width: 1200px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    padding: 10px;
  }
}
```

### 2. JavaScript 동적 높이 계산

```javascript
// 이미지 로드 후 높이 계산 및 배치
class MasonryGallery {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columnWidth: 300,
      gap: 16,
      baseRowHeight: 20,
      ...options
    };
    this.init();
  }

  init() {
    this.calculateLayout();
    this.setupInfiniteScroll();
    this.setupImageLoading();
  }

  calculateLayout() {
    const items = this.container.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
      const img = item.querySelector('img');
      
      img.onload = () => {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const targetHeight = this.options.columnWidth * aspectRatio;
        const spans = Math.ceil(targetHeight / this.options.baseRowHeight);
        
        // 높이 카테고리 결정
        let category = 'medium';
        if (spans <= 10) category = 'small';
        else if (spans <= 15) category = 'medium';
        else if (spans <= 20) category = 'large';
        else category = 'tall';
        
        item.setAttribute('data-height', category);
        item.style.gridRowEnd = `span ${spans}`;
      };
    });
  }

  setupImageLoading() {
    // Lazy loading 구현
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.onload = () => {
            img.classList.add('loaded');
            this.calculateItemLayout(img.closest('.gallery-item'));
          };
          observer.unobserve(img);
        }
      });
    });

    const images = this.container.querySelectorAll('img[data-src]');
    images.forEach(img => imageObserver.observe(img));
  }

  setupInfiniteScroll() {
    const scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreImages();
      }
    });

    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    this.container.appendChild(sentinel);
    scrollObserver.observe(sentinel);
  }

  async loadMoreImages() {
    // API에서 더 많은 이미지 로드
    try {
      const response = await fetch('/api/images?page=' + this.currentPage);
      const images = await response.json();
      
      images.forEach(imageData => {
        this.addImageToGallery(imageData);
      });
      
      this.currentPage++;
    } catch (error) {
      console.error('Failed to load more images:', error);
    }
  }

  addImageToGallery(imageData) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img data-src="${imageData.url}" 
           alt="${imageData.description}"
           loading="lazy">
      <div class="image-overlay">
        <div class="image-info">
          <span class="author">${imageData.author}</span>
        </div>
      </div>
    `;
    
    this.container.appendChild(item);
    this.setupImageLoading(); // 새 이미지에 lazy loading 적용
  }
}

// 사용법
const gallery = new MasonryGallery(
  document.querySelector('.gallery-container'),
  {
    columnWidth: 320,
    gap: 16,
    baseRowHeight: 20
  }
);
```

### 3. React 컴포넌트 구현

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

const MasonryImageGallery = ({ images, onLoadMore }) => {
  const [loadedImages, setLoadedImages] = useState([]);
  const [columns, setColumns] = useState(4);
  const containerRef = useRef(null);

  // 컬럼 수 계산
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 480) setColumns(2);
      else if (width < 768) setColumns(3);
      else if (width < 1200) setColumns(4);
      else setColumns(5);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // 이미지 로드 처리
  const handleImageLoad = useCallback((imageData, dimensions) => {
    setLoadedImages(prev => [...prev, { ...imageData, ...dimensions }]);
  }, []);

  // Masonry 레이아웃 계산
  const calculateMasonryLayout = (images, columns) => {
    const columnHeights = new Array(columns).fill(0);
    const positions = [];

    images.forEach((image, index) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestColumnIndex * (320 + 16); // columnWidth + gap
      const y = columnHeights[shortestColumnIndex];
      
      positions.push({ x, y, width: 320, height: image.calculatedHeight });
      columnHeights[shortestColumnIndex] += image.calculatedHeight + 16; // gap
    });

    return positions;
  };

  return (
    <div ref={containerRef} className="masonry-gallery">
      <div className="gallery-grid" style={{ position: 'relative' }}>
        {loadedImages.map((image, index) => {
          const position = calculateMasonryLayout(loadedImages, columns)[index];
          if (!position) return null;

          return (
            <ImageCard
              key={image.id}
              image={image}
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
              }}
              onLoad={handleImageLoad}
            />
          );
        })}
      </div>
    </div>
  );
};

// 개별 이미지 카드 컴포넌트
const ImageCard = ({ image, style, onLoad }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  const handleLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const aspectRatio = naturalHeight / naturalWidth;
      const calculatedHeight = 320 * aspectRatio; // columnWidth * aspectRatio
      
      onLoad(image, { calculatedHeight });
      setLoaded(true);
    }
  };

  return (
    <div className={`image-card ${loaded ? 'loaded' : ''}`} style={style}>
      <img
        ref={imgRef}
        src={image.url}
        alt={image.description}
        onLoad={handleLoad}
        loading="lazy"
      />
      <div className="image-overlay">
        <span className="author">{image.author}</span>
      </div>
    </div>
  );
};

export default MasonryImageGallery;
```

### 4. 고급 최적화 기법

```typescript
// TypeScript 인터페이스
interface ImageData {
  id: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  author: string;
  width: number;
  height: number;
  aspectRatio: number;
}

interface MasonryOptions {
  columnWidth: number;
  gap: number;
  baseRowHeight: number;
  maxColumns: number;
  breakpoints: Record<number, number>;
}

// 고성능 Masonry 클래스
class OptimizedMasonry {
  private items: ImageData[] = [];
  private positions: Map<string, {x: number, y: number, width: number, height: number}> = new Map();
  private columnHeights: number[] = [];
  private currentColumns = 0;

  constructor(
    private container: HTMLElement,
    private options: MasonryOptions
  ) {
    this.init();
  }

  private init() {
    this.calculateColumns();
    this.setupResizeObserver();
    this.setupIntersectionObserver();
  }

  private calculateColumns() {
    const containerWidth = this.container.clientWidth;
    const { columnWidth, gap, breakpoints } = this.options;
    
    // 반응형 컬럼 수 계산
    let columns = Math.floor((containerWidth + gap) / (columnWidth + gap));
    
    // 브레이크포인트 적용
    Object.entries(breakpoints).forEach(([breakpoint, cols]) => {
      if (containerWidth <= parseInt(breakpoint)) {
        columns = Math.min(columns, cols);
      }
    });

    this.currentColumns = Math.max(1, Math.min(columns, this.options.maxColumns));
    this.columnHeights = new Array(this.currentColumns).fill(0);
  }

  public addImages(images: ImageData[]) {
    images.forEach(image => this.addImage(image));
    this.render();
  }

  private addImage(image: ImageData) {
    const shortestColumnIndex = this.getShortestColumnIndex();
    const position = this.calculatePosition(image, shortestColumnIndex);
    
    this.positions.set(image.id, position);
    this.columnHeights[shortestColumnIndex] += position.height + this.options.gap;
    this.items.push(image);
  }

  private calculatePosition(image: ImageData, columnIndex: number) {
    const { columnWidth, gap } = this.options;
    const x = columnIndex * (columnWidth + gap);
    const y = this.columnHeights[columnIndex];
    const height = columnWidth * image.aspectRatio;

    return { x, y, width: columnWidth, height };
  }

  private getShortestColumnIndex() {
    return this.columnHeights.indexOf(Math.min(...this.columnHeights));
  }

  private render() {
    // Virtual scrolling 또는 직접 DOM 조작
    this.items.forEach(item => {
      const position = this.positions.get(item.id);
      if (position && this.isInViewport(position)) {
        this.renderItem(item, position);
      }
    });
  }

  private isInViewport(position: {x: number, y: number, width: number, height: number}) {
    const scrollTop = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    return position.y < scrollTop + viewportHeight + 200 && // 200px buffer
           position.y + position.height > scrollTop - 200;
  }

  private renderItem(item: ImageData, position: {x: number, y: number, width: number, height: number}) {
    let element = document.getElementById(item.id);
    
    if (!element) {
      element = this.createElement(item);
      this.container.appendChild(element);
    }

    // Position 업데이트
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
    element.style.width = `${position.width}px`;
    element.style.height = `${position.height}px`;
  }

  private createElement(item: ImageData): HTMLElement {
    const div = document.createElement('div');
    div.id = item.id;
    div.className = 'masonry-item';
    div.innerHTML = `
      <img src="${item.thumbnailUrl}" 
           data-full-src="${item.url}"
           alt="${item.description}"
           loading="lazy">
      <div class="overlay">
        <span class="author">${item.author}</span>
      </div>
    `;
    
    return div;
  }

  private setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this.calculateColumns();
      this.recalculateLayout();
    });
    
    resizeObserver.observe(this.container);
  }

  private setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const fullSrc = img.dataset.fullSrc;
          
          if (fullSrc && img.src !== fullSrc) {
            img.src = fullSrc;
            img.onload = () => img.classList.add('loaded');
          }
        }
      });
    }, { rootMargin: '50px' });

    // 모든 이미지에 observer 적용
    this.container.querySelectorAll('img').forEach(img => {
      observer.observe(img);
    });
  }

  private recalculateLayout() {
    this.columnHeights.fill(0);
    this.positions.clear();
    
    this.items.forEach(item => {
      const shortestColumnIndex = this.getShortestColumnIndex();
      const position = this.calculatePosition(item, shortestColumnIndex);
      
      this.positions.set(item.id, position);
      this.columnHeights[shortestColumnIndex] += position.height + this.options.gap;
    });
    
    this.render();
  }
}

// 사용 예시
const gallery = new OptimizedMasonry(
  document.querySelector('.gallery-container')!,
  {
    columnWidth: 320,
    gap: 16,
    baseRowHeight: 20,
    maxColumns: 6,
    breakpoints: {
      480: 2,
      768: 3,
      1024: 4,
      1440: 5
    }
  }
);
```

## 🎨 미드저니 디자인 특징 적용

### 색상 시스템
```css
:root {
  /* 미드저니 inspired 색상 */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #ff6b6b;
  --accent-hover: #ff5252;
  
  /* 그라데이션 */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  
  /* 그림자 */
  --shadow-light: 0 4px 12px rgba(255, 255, 255, 0.1);
  --shadow-dark: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 다크 테마 갤러리 */
.gallery-container {
  background: var(--bg-primary);
  min-height: 100vh;
}

.gallery-item {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-dark);
}

.gallery-item:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.2);
}

/* 오버레이 효과 */
.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: var(--text-primary);
  padding: 20px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.gallery-item:hover .image-overlay {
  transform: translateY(0);
}
```

### 애니메이션 효과
```css
/* 이미지 로드 애니메이션 */
@keyframes imageLoad {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.gallery-item img.loaded {
  animation: imageLoad 0.5s ease-out;
}

/* 호버 효과 */
.gallery-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-item:hover {
  transform: translateY(-8px) scale(1.02);
}

/* 스켈레톤 로딩 */
.gallery-item.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

## 📱 반응형 최적화

### 모바일 우선 접근법
```css
/* 모바일 (320px - 767px) */
.gallery-container {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 10px;
}

/* 태블릿 (768px - 1023px) */
@media (min-width: 768px) {
  .gallery-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 15px;
  }
}

/* 데스크톱 (1024px - 1439px) */
@media (min-width: 1024px) {
  .gallery-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 20px;
  }
}

/* 대형 화면 (1440px+) */
@media (min-width: 1440px) {
  .gallery-container {
    grid-template-columns: repeat(5, 1fr);
    max-width: 1600px;
  }
}

/* 초대형 화면 (1920px+) */
@media (min-width: 1920px) {
  .gallery-container {
    grid-template-columns: repeat(6, 1fr);
    max-width: 2000px;
  }
}
```

## 🚀 성능 최적화

### 이미지 최적화
```javascript
// 이미지 크기별 URL 생성
const getOptimalImageUrl = (baseUrl, containerWidth) => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const targetWidth = containerWidth * devicePixelRatio;
  
  if (targetWidth <= 400) return `${baseUrl}?w=400&q=80`;
  if (targetWidth <= 800) return `${baseUrl}?w=800&q=85`;
  if (targetWidth <= 1200) return `${baseUrl}?w=1200&q=90`;
  return `${baseUrl}?w=1600&q=95`;
};

// WebP 지원 확인
const supportsWebP = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 이미지 포맷 최적화
const getOptimizedImageUrl = async (baseUrl, width) => {
  const isWebPSupported = await supportsWebP();
  const format = isWebPSupported ? 'webp' : 'jpg';
  return `${baseUrl}?w=${width}&f=${format}&q=85`;
};
```

## 📊 성능 메트릭

### 목표 성능
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### 모니터링 코드
```javascript
// 성능 모니터링
class PerformanceMonitor {
  static measureImageLoad(callback) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.initiatorType === 'img') {
          callback({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  static measureLayoutShift(callback) {
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          callback(entry.value);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

---

이 가이드를 통해 **미드저니와 같은 아름다운 가변 크기 이미지 갤러리**를 구현할 수 있습니다. 핵심은 **Masonry Layout**과 **적응형 이미지 최적화**입니다!