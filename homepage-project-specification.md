# AI 모델 갤러리 홈페이지 프로젝트 명세서

## 📋 프로젝트 개요

### 핵심 아이디어
**BlurBlur.ai의 기능과 구조**를 기반으로 하되, **미드저니의 이미지 배치 방식**을 적용한 AI 모델 갤러리 웹사이트 개발

### 프로젝트 배경
- 사용자들이 업로드하는 이미지는 **다양한 크기와 비율**을 가짐
- 기존의 **고정 그리드 방식**으로는 이미지 배치에 한계
- **미드저니의 Masonry Layout**을 적용하여 자연스러운 이미지 배치 구현

## 🎯 프로젝트 목표

### Primary Goals
1. **다양한 크기의 이미지**를 아름답게 배치하는 갤러리 시스템
2. **BlurBlur.ai 수준**의 사용자 경험과 기능성
3. **미드저니 스타일**의 시각적 매력도
4. **반응형 디자인**으로 모든 디바이스 지원

### Secondary Goals
- 고성능 이미지 로딩 및 최적화
- 직관적인 모델 검색 및 필터링
- 전문적인 문의 시스템
- SEO 친화적 구조

## 🏗️ 사이트 구조 및 기능

### 메인 페이지 구성
```
📁 프로젝트 구조
├── 🏠 홈페이지 (/)
│   ├── 히어로 섹션 (BlurBlur.ai와 달리 존재)
│   ├── 특별 모델 하이라이트
│   └── 최신 모델 미리보기
│
├── 🖼️ 모델 갤러리 (/models)
│   ├── 미드저니 스타일 Masonry Layout
│   ├── 카테고리 필터링 시스템
│   ├── 검색 기능
│   └── 무한 스크롤
│
├── 👤 모델 상세 페이지 (/models/{id})
│   ├── 고해상도 이미지 갤러리
│   ├── 모델 정보 및 메타데이터
│   ├── 관련 모델 추천
│   └── 다운로드/문의 버튼
│
├── 🎨 테마 컬렉션 (/themes)
│   ├── 특별 테마별 모델 그룹핑
│   └── 테마별 이미지 컬렉션
│
├── 📞 문의하기 (/contact)
│   ├── 단계별 문의 양식 (BlurBlur.ai 방식)
│   ├── 모델 선택 인터페이스
│   └── 파일 업로드 기능
│
└── 📄 기타 페이지
    ├── 소개 페이지 (/about)
    ├── 이용약관 (/terms)
    └── 개인정보처리방침 (/privacy)
```

### 핵심 기능 상세

#### 1. 미드저니 스타일 이미지 배치
```yaml
layout_system:
  type: "Masonry Grid Layout"
  columns: "반응형 (모바일 2열 → 데스크톱 5열)"
  image_handling:
    - "세로형 이미지 (2:3, 3:4 비율)"
    - "가로형 이미지 (4:3, 16:9 비율)"
    - "정사방형 이미지 (1:1 비율)"
    - "초세로형 이미지 (1:2 이상)"
  
optimization:
  - "이미지 lazy loading"
  - "WebP 포맷 지원"
  - "반응형 이미지 크기"
  - "무한 스크롤"
```

#### 2. 모델 분류 시스템 (BlurBlur.ai 기반)
```yaml
categories:
  demographic:
    - "Asian"
    - "Europe" 
    - "Africa America"
    - "Hispanic"
    - "Special" # 동물형, 판타지형, 캐릭터형
  
  industry:
    - "Fashion" # 패션, 하이패션
    - "Cosmetics" # 화장품, 뷰티
    - "Leisure/Sports" # 레저, 스포츠, 피트니스
    - "Digital/Electronics" # 디지털, 가전
    - "Furniture/Interior" # 가구, 인테리어
    - "Food" # 푸드, 웰니스
    - "Lifestyle" # 라이프스타일, 광고
    - "Music/Arts" # 음악, 악기, 액세서리
```

#### 3. 고급 검색 기능
```yaml
search_features:
  basic_search: "텍스트 기반 모델명/설명 검색"
  filter_system:
    - "카테고리 다중 선택"
    - "이미지 비율 필터 (세로형/가로형/정사각형)"
    - "업로드 날짜 범위"
    - "인기도/조회수 기준"
  
  sort_options:
    - "최신순"
    - "인기순"
    - "이름순"
    - "카테고리순"
```

#### 4. 모델 상세 정보 시스템
```yaml
model_details:
  basic_info:
    - "모델명 (한글/영문)"
    - "카테고리 태그"
    - "업로드 날짜"
    - "해상도 정보"
    - "파일 크기"
  
  metadata:
    - "추천 활용 분야"
    - "무드/분위기 태그"  
    - "색상 팔레트"
    - "스타일 키워드"
  
  engagement:
    - "조회수"
    - "좋아요 수"
    - "다운로드 수"
    - "공유 기능"
```

#### 5. 문의 시스템 (BlurBlur.ai 완전 복제)
```yaml
contact_system:
  step_1: "문의 유형 선택 (모델 구매/기타 의뢰)"
  step_2: "모델 선택 (드롭다운 + 썸네일)"
  step_3: "상세 요구사항 입력"
    - "문의 유형: 모델 이미지 구매/신규 모델 제작"
    - "카테고리: 패션/뷰티/레저/디지털/가구/기타"
    - "이미지 컷 수 (숫자 입력)"
    - "납기일 (날짜 선택)"
    - "상세 내용 (텍스트)"
    - "참고 파일 (최대 3개, 20MB)"
  step_4: "의뢰자 정보"
    - "이름*, 회사명*, 사업자등록번호*"
    - "연락처*, 이메일*"
    - "개인정보 수집 동의"
```

## 🎨 디자인 시스템

### 시각적 컨셉
**"미드저니의 창의적 배치 + BlurBlur.ai의 미니멀함"**

#### 색상 시스템
```css
primary_colors:
  background: "#0a0a0a" /* 다크 베이스 */
  surface: "#1a1a1a" /* 카드 배경 */
  text_primary: "#ffffff"
  text_secondary: "#b0b0b0"

accent_colors:
  primary: "#667eea" /* 블루 그라데이션 */
  secondary: "#764ba2" /* 퍼플 그라데이션 */
  highlight: "#ff6b6b" /* 강조 색상 */

gradients:
  primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  secondary: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
```

#### 타이포그래피
```css
typography:
  heading_primary: "32px-48px, 700 weight"
  heading_secondary: "24px-32px, 600 weight"
  body_large: "18px, 400 weight"
  body_regular: "16px, 400 weight"
  body_small: "14px, 400 weight"
  
font_family:
  primary: "'Inter', system-ui, sans-serif"
  secondary: "'JetBrains Mono', monospace" # 코드/메타데이터용
```

#### 컴포넌트 스타일
```css
components:
  cards:
    border_radius: "12px"
    shadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
    hover_effect: "translateY(-8px) + shadow 증가"
  
  buttons:
    primary: "그라데이션 배경 + 흰색 텍스트"
    secondary: "투명 배경 + 테두리 + 그라데이션 텍스트"
    hover: "0.3s cubic-bezier transition"
  
  inputs:
    background: "rgba(255, 255, 255, 0.1)"
    border: "1px solid rgba(255, 255, 255, 0.2)"
    focus: "그라데이션 테두리"
```

## 💻 기술 스택

### 프론트엔드
```yaml
core_framework: "React 18+ with TypeScript"
styling: "Tailwind CSS + Styled Components"
state_management: "Zustand + React Query"
routing: "React Router v6"
ui_components: "Radix UI + Custom Components"

image_handling:
  optimization: "Next.js Image Component"
  lazy_loading: "Intersection Observer API"
  formats: "WebP with JPEG fallback"
  
animations: "Framer Motion"
```

### 백엔드
```yaml
runtime: "Node.js + Express"
database: "PostgreSQL + Prisma ORM"
file_storage: "AWS S3 + CloudFront CDN"
image_processing: "Sharp.js"

authentication: "JWT + refresh tokens"
email_service: "SendGrid"
monitoring: "Winston + Morgan"
```

### 배포 및 인프라
```yaml
hosting: "Vercel (Frontend) + Railway (Backend)"
database: "Supabase PostgreSQL"
cdn: "CloudFront"
domain: "Namecheap + Cloudflare"
monitoring: "Vercel Analytics + Sentry"
```

## 📱 반응형 디자인

### 브레이크포인트 시스템
```css
breakpoints:
  mobile: "320px - 767px" # 2열 그리드
  tablet: "768px - 1023px" # 3열 그리드  
  desktop: "1024px - 1439px" # 4열 그리드
  large: "1440px - 1919px" # 5열 그리드
  xlarge: "1920px+" # 6열 그리드

masonry_columns:
  mobile: 2
  tablet: 3
  desktop: 4
  large: 5
  xlarge: 6
```

### 모바일 최적화
```yaml
mobile_features:
  touch_optimization: "44px 최소 터치 영역"
  gesture_support: "스와이프 네비게이션"
  image_optimization: "모바일용 압축 이미지"
  performance: "모바일 번들 크기 최적화"
```

## 🚀 성능 목표

### Core Web Vitals
```yaml
performance_targets:
  first_contentful_paint: "< 1.5초"
  largest_contentful_paint: "< 2.5초"
  cumulative_layout_shift: "< 0.1"
  first_input_delay: "< 100ms"
  time_to_interactive: "< 3.5초"
```

### 최적화 전략
```yaml
optimization_strategies:
  images:
    - "WebP 포맷 + JPEG 폴백"
    - "반응형 이미지 크기"
    - "Lazy loading + Intersection Observer"
    - "이미지 압축 (85% 품질)"
  
  code:
    - "코드 스플리팅"
    - "Tree shaking"
    - "Bundle 분석 및 최적화"
    - "Critical CSS 인라인"
  
  caching:
    - "브라우저 캐싱"
    - "CDN 캐싱"
    - "Service Worker 캐싱"
    - "API 응답 캐싱"
```

## 🔄 개발 단계

### Phase 1: 기본 구조 (4주)
- [x] 프로젝트 셋업 및 기본 라우팅
- [ ] 미드저니 스타일 Masonry 레이아웃 구현
- [ ] 기본 모델 목록 페이지
- [ ] 모바일 반응형 대응

### Phase 2: 핵심 기능 (6주)
- [ ] 모델 상세 페이지
- [ ] 검색 및 필터링 시스템  
- [ ] 이미지 최적화 및 lazy loading
- [ ] 문의 시스템 구현

### Phase 3: 고도화 (4주)
- [ ] 테마 시스템
- [ ] 무한 스크롤
- [ ] 성능 최적화
- [ ] SEO 및 메타데이터

### Phase 4: 런칭 준비 (2주)
- [ ] 최종 테스트
- [ ] 배포 및 도메인 연결
- [ ] 모니터링 설정
- [ ] 사용자 피드백 수집

## 📊 예상 결과물

### 사용자 경험
1. **직관적인 이미지 탐색**: 미드저니 스타일의 자연스러운 이미지 배치
2. **빠른 로딩 속도**: 최적화된 이미지 로딩으로 2초 이내 초기 로딩
3. **전문적인 문의 프로세스**: BlurBlur.ai 수준의 체계적인 문의 시스템
4. **모바일 친화적**: 모든 디바이스에서 완벽한 사용 경험

### 기술적 성취
1. **고성능 Masonry Layout**: 수천 개 이미지도 부드럽게 처리
2. **확장 가능한 아키텍처**: 향후 기능 추가 및 트래픽 증가 대응
3. **SEO 최적화**: 검색 엔진에서 높은 가시성
4. **접근성 준수**: WCAG 2.1 AA 수준 접근성

---

*이 명세서는 BlurBlur.ai의 기능적 완성도와 미드저니의 시각적 매력을 결합한 차세대 AI 모델 갤러리 구현을 목표로 합니다.*