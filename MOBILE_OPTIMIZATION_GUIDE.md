# 📱 TK AI 모델 갤러리 - 모바일 최적화 가이드

## 🎯 핵심 원칙

**웹 디자인 절대 불변** → **모바일만 최적화**

- **데스크톱 (1024px+)**: BlurBlur.ai 디자인 100% 유지
- **모바일 (320px-767px)**: 반응형 최적화 적용
- **레이아웃**: Midjourney Masonry 시스템 모든 화면에서 유지

## 📐 반응형 브레이크포인트 시스템

### 컬럼 시스템
```css
/* 모바일 Small (320px-479px): 2열 */
/* 모바일 Large (480px-767px): 2열 */
/* 태블릿 (768px-1023px): 3열 */
/* 데스크톱 (1024px-1439px): 4열 */
/* 대형 화면 (1440px-1919px): 5열 */
/* 초대형 화면 (1920px+): 6열 */
```

### 간격 및 패딩 최적화
- **모바일**: gap: 8px, padding: 12px
- **태블릿**: gap: 12px, padding: 16px
- **데스크톱**: gap: 16px, padding: 20px (기존 유지)

## 🎨 구현된 모바일 최적화 컴포넌트

### 1. CSS 반응형 시스템
**파일**: `styles/mobile-optimized.css`

**특징**:
- 모바일 우선 설계
- GPU 가속 활용
- 터치 친화적 인터랙션
- 안전한 영역 처리 (노치 대응)

**주요 클래스**:
```css
.mobile-only      /* 모바일에서만 표시 */
.desktop-only     /* 데스크톱에서만 표시 */
.touch-target     /* 터치 친화적 크기 (44px+) */
.touch-feedback   /* 터치 피드백 애니메이션 */
.safe-area-inset  /* 노치 대응 패딩 */
```

### 2. 모바일 네비게이션
**파일**: `components/MobileNavigation.tsx`

**특징**:
- 햄버거 메뉴 방식
- 전체 화면 오버레이
- 터치 친화적 메뉴 아이템 (60px 높이)
- 스크롤 잠금 기능
- 접근성 최적화 (ARIA 속성)

**사용법**:
```tsx
import MobileNavigation from './components/MobileNavigation';

<MobileNavigation className="lg:hidden" />
```

### 3. 최적화 이미지 컴포넌트
**파일**: `components/OptimizedImage.tsx`

**특징**:
- WebP/AVIF 포맷 우선 지원
- Progressive Loading
- 모바일 해상도 자동 조정
- 스켈레톤 로딩 효과
- Intersection Observer 기반 Lazy Loading

**사용법**:
```tsx
import OptimizedImage from './components/OptimizedImage';

<OptimizedImage
  src="/images/model.jpg"
  alt="모델 이름"
  width={400}
  height={600}
  sizes="(max-width: 479px) 50vw, (max-width: 767px) 50vw, 33vw"
/>
```

### 4. 모바일 Masonry 갤러리
**파일**: `components/MobileMasonryGallery.tsx`

**특징**:
- 화면 크기별 자동 컬럼 조정
- 동적 레이아웃 계산
- 무한 스크롤 지원
- 터치 피드백 (햅틱 포함)
- 성능 최적화 (contain: layout)

**사용법**:
```tsx
import MobileMasonryGallery from './components/MobileMasonryGallery';

<MobileMasonryGallery
  models={models}
  onModelClick={handleModelClick}
  onLoadMore={loadMoreModels}
  hasMore={hasMore}
  isLoading={isLoading}
/>
```

## ⚡ 성능 최적화 시스템

### 성능 목표
- **모바일 LCP**: < 2.5초
- **모바일 CLS**: < 0.1
- **모바일 FID**: < 100ms
- **번들 크기**: < 500KB 초기
- **이미지 로딩**: < 1초

### 성능 모니터링
**파일**: `lib/mobile-performance.ts`

**사용법**:
```tsx
import { initMobileOptimization, PerformanceMonitor } from './lib/mobile-performance';

// 앱 초기화 시
useEffect(() => {
  initMobileOptimization().then((config) => {
    console.log('Mobile optimization initialized:', config);
  });
}, []);
```

### 이미지 최적화 전략

#### 1. 포맷 우선순위
```
AVIF > WebP > JPEG
```

#### 2. 해상도 최적화
```typescript
// 모바일용 해상도 계산
const mobileWidth = Math.min(400, (window.innerWidth / 2) * devicePixelRatio);

// 품질 설정
const quality = isMobile ? 80 : 85;
```

#### 3. 사이즈 정책
```typescript
sizes="(max-width: 479px) 50vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
```

## 📱 모바일 UX 최적화

### 터치 인터랙션
- **최소 터치 영역**: 44px × 44px (iOS 가이드라인)
- **터치 피드백**: scale(0.95) + opacity(0.8)
- **햅틱 피드백**: navigator.vibrate(50ms)

### 스크롤 최적화
- **부드러운 스크롤**: `scroll-behavior: smooth`
- **모멘텀 스크롤**: `-webkit-overflow-scrolling: touch`
- **과스크롤 방지**: `overscroll-behavior: none`

### 접근성 개선
- **키보드 네비게이션**: Tab, Enter, Space 지원
- **스크린 리더**: ARIA 속성 완전 지원
- **고대비 모드**: 색상 대비 4.5:1 이상
- **포커스 표시**: `:focus-visible` 활용

## 🔧 구현 가이드

### 1. 프로젝트에 모바일 최적화 적용

#### 단계 1: CSS 파일 포함
```tsx
// pages/_app.tsx 또는 layout.tsx
import '../styles/mobile-optimized.css';
```

#### 단계 2: 네비게이션 교체
```tsx
// 기존 네비게이션을 조건부 렌더링으로 교체
{/* 데스크톱 네비게이션 */}
<nav className="desktop-only">
  {/* 기존 네비게이션 */}
</nav>

{/* 모바일 네비게이션 */}
<MobileNavigation className="mobile-only" />
```

#### 단계 3: 이미지 컴포넌트 교체
```tsx
// 기존 img 태그를 OptimizedImage로 교체
<OptimizedImage
  src={model.imageUrl}
  alt={model.name}
  width={400}
  height={600}
  priority={index < 4} // 첫 4개 이미지만 우선 로딩
/>
```

#### 단계 4: 갤러리 컴포넌트 교체
```tsx
// 기존 갤러리를 MobileMasonryGallery로 교체
<MobileMasonryGallery
  models={models}
  onModelClick={(model) => router.push(`/model/${model.slug}`)}
  onLoadMore={loadMoreModels}
  hasMore={hasNextPage}
  isLoading={isLoading}
/>
```

### 2. Next.js 설정 최적화

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 번들 최적화
  experimental: {
    optimizePackageImports: ['react-responsive-masonry', 'framer-motion'],
  },

  // 성능 최적화
  compress: true,
  poweredByHeader: false,

  // Progressive Web App
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  }
};

module.exports = nextConfig;
```

#### tailwind.config.js
```javascript
module.exports = {
  // 모바일 우선 브레이크포인트
  theme: {
    screens: {
      'xs': '480px',
      'sm': '768px',
      'md': '1024px',
      'lg': '1440px',
      'xl': '1920px',
    },
    extend: {
      // 터치 친화적 간격
      spacing: {
        'touch': '44px',
      },
      // 모바일 타이포그래피
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
      }
    }
  }
};
```

## 📊 성능 측정 및 모니터링

### 개발 환경에서 성능 확인
```bash
# Lighthouse CI 실행
npm run lighthouse

# Bundle Analyzer 실행
npm run analyze

# Core Web Vitals 측정
npm run performance
```

### 운영 환경 모니터링
```typescript
// 실시간 성능 모니터링
PerformanceMonitor.measureCoreWebVitals((metric) => {
  // 성능 메트릭을 analytics로 전송
  analytics.track('performance_metric', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    device: detectDevice(),
    connection: getConnectionType()
  });
});
```

## 🚀 배포 최적화

### 이미지 CDN 설정
```typescript
// 이미지 CDN URL 생성
const getImageUrl = (src: string, options: ImageOptions) => {
  const { width, quality = 85, format = 'webp' } = options;
  return `https://cdn.example.com/images/${src}?w=${width}&q=${quality}&f=${format}`;
};
```

### 서비스 워커 설정
```javascript
// public/sw.js
// 이미지 캐싱 전략
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open('images-v1').then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

## ✅ 체크리스트

### 모바일 최적화 완료 확인
- [ ] 모바일에서 2열 Masonry 레이아웃 동작
- [ ] 햄버거 메뉴 정상 작동
- [ ] 터치 인터랙션 44px 이상 크기
- [ ] 이미지 WebP/AVIF 포맷 우선 로딩
- [ ] Progressive Loading 동작 확인
- [ ] Core Web Vitals 목표 달성
- [ ] 무한 스크롤 정상 작동
- [ ] 접근성 기준 충족 (WCAG 2.1 AA)

### 성능 테스트
- [ ] Lighthouse Mobile 점수 90+ 달성
- [ ] 3G 환경에서 LCP < 2.5초
- [ ] 이미지 로딩 시간 < 1초
- [ ] JavaScript 번들 < 500KB
- [ ] 메모리 사용량 안정적

### 사용자 경험
- [ ] 터치 피드백 즉시 반응
- [ ] 스크롤 부드럽게 동작
- [ ] 로딩 상태 명확하게 표시
- [ ] 에러 상황 적절히 처리
- [ ] 오프라인 기본 대응

---

**이 가이드에 따라 구현하면 웹 디자인은 그대로 유지하면서 모바일에서 최적의 사용자 경험을 제공할 수 있습니다.**