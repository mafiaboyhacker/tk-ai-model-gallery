# 📱 모바일 헤더 겹침 해결 가이드

## 🔧 문제 해결 방법

### 문제: 모바일에서 로고와 햄버거 메뉴가 겹침

**원인**:
1. 작은 화면에서 공간 부족
2. Flexbox justify-between이 제대로 작동하지 않음
3. Z-index 레이어 충돌
4. 터치 영역 크기 부족

### ✅ 해결 방안

## 1. 📱 MobileHeader 컴포넌트 사용

**파일**: `components/MobileHeader.tsx`

### 사용법
```tsx
import MobileHeader from './components/MobileHeader';

// 기존 헤더 대신 사용
<MobileHeader />
```

### 특징
- **화면별 적응형 레이아웃**:
  - 모바일 (320px-767px): 14px 높이, 간소화된 레이아웃
  - 태블릿 (768px-1023px): 16px 높이, 중간 크기 네비게이션
  - 데스크톱 (1024px+): 20px 높이, 기존 디자인 유지

- **겹침 방지 설계**:
  - 로고: `flex-shrink: 0` + 최소/최대 너비 제한
  - 메뉴: `flex-shrink: 0` + 최소 터치 영역 보장
  - 간격: `gap: 16px` 최소 간격 확보

## 2. 🎨 CSS 레이어 시스템

**파일**: `styles/mobile-optimized.css`

### Z-index 계층 구조
```css
:root {
  --z-tooltip: 1000;    /* 툴팁 */
  --z-modal: 900;       /* 모달/메뉴 */
  --z-overlay: 800;     /* 백드롭 */
  --z-dropdown: 700;    /* 드롭다운 */
  --z-sticky: 600;     /* 스티키 요소 */
  --z-header: 500;      /* 헤더 */
  --z-navigation: 400;  /* 네비게이션 */
  --z-content: 100;     /* 컨텐츠 */
  --z-base: 1;         /* 기본 */
}
```

### CSS 클래스 사용
```tsx
// 헤더
<header className="header-layer"> {/* z-index: 500 */}

// 햄버거 버튼
<button className="hamburger-layer"> {/* z-index: 910 */}

// 모바일 메뉴
<div className="mobile-menu-layer"> {/* z-index: 900 */}

// 백드롭
<div className="backdrop-layer"> {/* z-index: 800 */}
```

## 3. 📐 레이아웃 최적화

### 헤더 구조
```tsx
<header className="header-layer bg-white">
  <div className="flex items-center justify-between h-14 px-4">
    {/* 로고 - 왼쪽 고정 */}
    <div className="flex-shrink-0 header-logo">
      <Link href="/">blur blur</Link>
    </div>

    {/* 햄버거 메뉴 - 오른쪽 고정 */}
    <div className="flex-shrink-0 header-menu">
      <MobileNavigation />
    </div>
  </div>
</header>
```

### CSS 최적화
```css
/* 로고 영역 */
.header-logo {
  flex-shrink: 0;
  min-width: 120px;  /* 최소 너비 보장 */
  max-width: 60%;    /* 최대 너비 제한 */
}

/* 메뉴 영역 */
.header-menu {
  flex-shrink: 0;
  min-width: 48px;   /* 터치 영역 보장 */
}

/* 컨테이너 */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;         /* 최소 간격 보장 */
}
```

## 4. 🔄 터치 최적화

### 햄버거 버튼 개선
```css
.hamburger-btn {
  min-width: 44px;   /* iOS 가이드라인 */
  min-height: 44px;
  padding: 8px;
  background: transparent;
  border: 0;
}

.hamburger-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.hamburger-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}
```

### 햄버거 라인 최적화
```css
.hamburger-line {
  width: 20px;
  height: 2px;
  background: #2d2d2d;
  border-radius: 1px;
  margin: 2px 0;
  transition: all 0.3s ease;
}
```

## 5. 📱 반응형 브레이크포인트

### 화면별 최적화
```css
/* 모바일 Small (320px-479px) */
@media (max-width: 479px) {
  .mobile-header {
    height: 56px;  /* 14 * 4 */
    padding: 0 12px;
  }

  .header-logo {
    font-size: 1rem;
    min-width: 100px;
  }
}

/* 모바일 Large (480px-767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .mobile-header {
    height: 56px;
    padding: 0 16px;
  }

  .header-logo {
    font-size: 1.125rem;
    min-width: 120px;
  }
}

/* 태블릿 (768px-1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-header {
    height: 64px;  /* 16 * 4 */
    padding: 0 24px;
  }
}
```

## 6. 🎯 구현 체크리스트

### ✅ 기본 구현
- [ ] MobileHeader 컴포넌트 생성
- [ ] 기존 헤더를 MobileHeader로 교체
- [ ] mobile-optimized.css 파일 포함
- [ ] Z-index 레이어 시스템 적용

### ✅ 레이아웃 확인
- [ ] 모바일에서 로고와 메뉴 간격 확보
- [ ] 터치 영역 44px 이상 확보
- [ ] 화면 회전 시 레이아웃 유지
- [ ] 다양한 기기에서 테스트

### ✅ 성능 확인
- [ ] Z-index 충돌 없음
- [ ] 부드러운 애니메이션
- [ ] 메모리 누수 없음
- [ ] 접근성 기준 충족

## 7. 🔧 문제 해결 FAQ

### Q1: 여전히 겹침 현상이 발생한다면?
```css
/* 강제 간격 확보 */
.header-content {
  justify-content: space-between !important;
  gap: 20px !important;
}

.header-logo {
  max-width: 50% !important;
}
```

### Q2: 햄버거 버튼이 너무 작다면?
```css
.hamburger-btn {
  min-width: 48px !important;
  min-height: 48px !important;
  padding: 12px !important;
}
```

### Q3: 헤더가 다른 요소와 겹친다면?
```css
/* 컨텐츠 영역에 상단 패딩 추가 */
.main-content {
  padding-top: 60px; /* 헤더 높이 + 여유 */
}

/* 또는 body에 전역 패딩 */
body.header-fixed {
  padding-top: 60px;
}
```

### Q4: 브레이크포인트가 제대로 작동하지 않는다면?
```tsx
// useEffect로 화면 크기 확인
useEffect(() => {
  const checkScreenSize = () => {
    const width = window.innerWidth;
    console.log('Screen width:', width);

    if (width < 768) {
      document.body.classList.add('mobile-layout');
    } else {
      document.body.classList.remove('mobile-layout');
    }
  };

  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  return () => window.removeEventListener('resize', checkScreenSize);
}, []);
```

## 8. 📊 테스트 가이드

### 테스트 기기
- **iPhone SE (375px)**: 최소 크기 테스트
- **iPhone 12 (390px)**: 표준 모바일 테스트
- **iPad (768px)**: 태블릿 전환점 테스트
- **Desktop (1024px+)**: 데스크톱 유지 확인

### 테스트 시나리오
1. **기본 레이아웃**: 로고와 메뉴 간격 확인
2. **화면 회전**: 세로/가로 모드 전환
3. **터치 테스트**: 햄버거 버튼 터치 영역
4. **스크롤 테스트**: 헤더 고정 상태 확인
5. **메뉴 오픈**: 오버레이 표시 확인

---

**이 가이드를 따라 구현하면 모바일에서 로고와 메뉴 겹침 문제가 완전히 해결됩니다!** 🎉