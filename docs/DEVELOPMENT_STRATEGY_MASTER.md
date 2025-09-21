# 🎯 AI 모델 갤러리 프로젝트 - 마스터 개발 전략

> **⚠️ 중요**: 이 문서는 프로젝트의 **핵심 개발 방향성**을 담은 **마스터 가이드**입니다.  
> **모든 새로운 대화**에서 이 전략을 **반드시 참조**하고 **일관성을 유지**해야 합니다.

---

## 🎨 **프로젝트 핵심 아이덴티티**

### 📋 **절대 불변의 원칙**
```yaml
디자인 아이덴티티: "BlurBlur.ai (https://blurblur.ai/model/)"
  - 미니멀 화이트 테마
  - 클린한 사용자 인터페이스
  - 전문적이고 고급스러운 브랜딩
  - 문의 시스템 4단계 프로세스
  - 카테고리 분류 체계

레이아웃 시스템: "Midjourney (https://www.midjourney.com/explore)"
  - Masonry Grid 레이아웃
  - 다양한 크기 이미지 지원
  - 반응형 컬럼 조정 (모바일 2열 → 데스크톱 5-6열)
  - 무한 스크롤
  - 자연스러운 이미지 배치

기술 참고: "Civitai (https://github.com/civitai/civitai)"
  - 데이터베이스 스키마 구조
  - API 아키텍처 패턴
  - 파일 업로드 로직
  - 백엔드 시스템 설계
```

## 🏆 **확정된 개발 전략: 하이브리드 접근법**

### ✨ **직접 개발 영역** (UI/UX 완벽 구현)
```yaml
책임 범위:
  - BlurBlur.ai 디자인 시스템 완전 클론
  - Midjourney Masonry 레이아웃 정확 구현
  - 사용자 경험 최적화
  - 반응형 디자인
  - 모든 프론트엔드 컴포넌트

기술 스택:
  framework: "Next.js 15.4.0-canary (App Router + React 19)"
  language: "TypeScript 5.9.2"
  styling: "Tailwind CSS v4"
  layout_engine: "react-responsive-masonry"
  animation: "Framer Motion"
  state_management: "Zustand + React Query"
```

### 🔧 **오픈소스 활용 영역** (검증된 로직 참고)
```yaml
활용 범위:
  - Civitai 데이터베이스 스키마 분석 후 적용
  - API 아키텍처 패턴 참고
  - 파일 업로드/이미지 처리 로직 참고
  - 인증 및 보안 시스템 참고
  
기술 스택:
  backend: "Next.js 15.4.0 API Routes"
  database: "PostgreSQL + Prisma ORM v6"
  authentication: "NextAuth.js v5"
  file_storage: "AWS S3 + CloudFront CDN"
  image_processing: "Sharp.js + FFmpeg"
```

---

## 📈 **단계별 개발 로드맵**

### 🔍 **Phase 1: 분석 및 준비** (1주)
```yaml
Week 1:
  Day 1-3: "Civitai 코드베이스 심층 분석"
    - prisma/schema.prisma 데이터베이스 구조 파악
    - /api 폴더 API 설계 패턴 이해  
    - 파일 업로드 및 이미지 처리 로직 추출
    - 핵심 컴포넌트 구조 분석
    
  Day 4-5: "개발 환경 세팅"
    - Next.js 15.4.0-canary 프로젝트 초기화 (React 19)
    - TypeScript 5.9.2 + Tailwind CSS v4 설정
    - Prisma ORM v6 + PostgreSQL 설정
    - 개발 도구 및 린팅 설정
    
  Day 6-7: "BlurBlur.ai 디자인 시스템 분석"
    - 색상 팔레트 추출
    - 타이포그래피 분석
    - 컴포넌트 규칙 정의
    - 반응형 브레이크포인트 설정
```

### 🎨 **Phase 2: UI 컴포넌트 개발** (2-3주)
```yaml
Week 2-3: "핵심 UI 컴포넌트"
  - Header/Navigation (BlurBlur.ai 스타일)
  - Model Card Component
  - Category Filter Panel  
  - Search Bar Component
  - Footer Component
  
Week 3-4: "Masonry 갤러리 시스템"
  - react-responsive-masonry 통합
  - 이미지 Lazy Loading
  - 무한 스크롤 구현
  - 반응형 컬럼 조정
  - 성능 최적화
```

### 🔧 **Phase 3: 백엔드 로직 개발** (2-3주)  
```yaml
Week 4-5: "데이터베이스 및 API"
  - Prisma ORM v6 스키마 설계 (Civitai 참고)
  - 모델 CRUD API 개발 (Next.js 15 App Router)
  - 카테고리 관리 API
  - 검색 및 필터링 API
  
Week 5-6: "파일 및 이미지 처리"
  - AWS S3 업로드 시스템
  - 이미지 최적화 파이프라인
  - WebP 변환 및 리사이징
  - CDN 통합
```

### 🚀 **Phase 4: 통합 및 최적화** (2주)
```yaml
Week 6-7: "시스템 통합"
  - 프론트엔드-백엔드 연동
  - 문의 시스템 구현 (BlurBlur.ai 4단계 프로세스)
  - 사용자 인증 시스템
  - 관리자 기능
  
Week 7-8: "최적화 및 배포"
  - 성능 최적화
  - SEO 최적화  
  - 테스팅 및 버그 수정
  - Vercel/Railway 배포
```

---

## 🎯 **핵심 기능 명세**

### 📋 **필수 구현 기능 (BlurBlur.ai 기준)**
```yaml
홈페이지:
  - 히어로 섹션
  - 특별 모델 하이라이트
  - 최신 모델 미리보기
  
모델 갤러리:
  - Masonry Layout (Midjourney 스타일)
  - 카테고리 필터링 (Asian, Europe, Africa America, Hispanic, Special)
  - 산업별 필터 (Fashion, Cosmetics, Leisure/Sports, etc.)
  - 검색 기능
  - 무한 스크롤
  
모델 상세 페이지:
  - 고해상도 이미지 갤러리
  - 모델 정보 및 메타데이터
  - 관련 모델 추천
  - 다운로드/문의 버튼
  
문의 시스템:
  - Step 1: 문의 유형 선택
  - Step 2: 모델 선택 (드롭다운 + 썸네일)
  - Step 3: 상세 요구사항 입력
  - Step 4: 의뢰자 정보
```

### ⚡ **성능 목표**
```yaml
Core Web Vitals:
  FCP: "< 1.5초"
  LCP: "< 2.5초" 
  CLS: "< 0.1"
  FID: "< 100ms"
  
번들 크기:
  Initial: "< 500KB"
  Total: "< 2MB"
  
이미지 최적화:
  Format: "WebP with JPEG fallback"
  Quality: "85% WebP, 90% JPEG"
  Loading: "Lazy loading with Intersection Observer"
```

---

## 🔗 **참고 리소스 링크**

### 📊 **핵심 분석 문서**
- `blurblur-design-analysis.md` - BlurBlur.ai 완전 분석
- `midjourney-style-guide.md` - Masonry 레이아웃 구현 가이드
- `homepage-project-specification.md` - 프로젝트 통합 명세서
- `project-architecture-overview.md` - 시스템 아키텍처 설계
- `open-source-alternatives-analysis.md` - 오픈소스 분석 결과

### 🌐 **핵심 참조 사이트**
```yaml
디자인_참고: "https://blurblur.ai/model/"
레이아웃_참고: "https://www.midjourney.com/explore?tab=top"  
기술_참고: "https://github.com/civitai/civitai"
데모_템플릿: "https://nextjs-tailwind-masonry-gallery.vercel.app/"
```

---

## ⚠️ **중요한 제약사항 및 원칙**

### 🚫 **절대 변경하면 안 되는 것들**
```yaml
금지사항:
  - BlurBlur.ai 디자인 아이덴티티 변경 금지
  - 고정 그리드 레이아웃 사용 금지 (반드시 Masonry)
  - Civitai UI 그대로 사용 금지 (기술 로직만 참고)
  - 성능 목표 하향 조정 금지
  
필수사항:
  - 모든 이미지는 다양한 크기 지원해야 함
  - 반응형 디자인 필수
  - 접근성(a11y) WCAG 2.1 AA 준수
  - TypeScript 타입 안정성 유지
```

### ✅ **품질 체크리스트**
```yaml
UI/UX 검증:
  - BlurBlur.ai와 95% 이상 시각적 일치도
  - Midjourney와 동일한 레이아웃 동작
  - 모바일 반응형 완벽 작동
  - 접근성 기준 충족
  
기술적 검증:
  - TypeScript 오류 0개
  - ESLint/Prettier 통과
  - 성능 목표 달성
  - 보안 취약점 0개
  
기능적 검증:
  - 모든 필수 기능 작동
  - 문의 시스템 4단계 완벽 작동
  - 파일 업로드 안정성
  - 검색/필터링 정확도
```

---

## 📞 **새로운 대화 시 체크리스트**

### 🚨 **중요: 새로운 채팅 세션 시작 시**
```bash
# 1. 마스터 계획부터 읽기
@MASTER_DEVELOPMENT_PLAN.md를 먼저 읽어주세요.

# 2. 현재 상황 파악  
현재 어떤 Phase가 진행 중이고, 다음에 할 일은 무엇인가요?

# 3. 이 문서는 보조 자료
DEVELOPMENT_STRATEGY_MASTER.md는 전략 참고용입니다.
```

### 🔍 **반드시 확인할 사항**
1. ✅ `MASTER_DEVELOPMENT_PLAN.md` 파일을 먼저 읽었는가?
2. ✅ 현재 Phase와 다음 작업을 파악했는가?
3. ✅ BlurBlur.ai + Midjourney + Civitai 조합을 이해했는가?
4. ✅ 하이브리드 접근법(UI 직접 + 로직 참고)을 인지했는가?
5. ✅ 변경하면 안 되는 제약사항들을 확인했는가?

### 🎯 **새로운 대화 시작 시 필수 질문**
```
"MASTER_DEVELOPMENT_PLAN.md를 읽고 현재 Phase를 확인해 주세요."
"다음에 진행해야 할 작업이 무엇인지 알려주세요."
"BlurBlur.ai 디자인과 Midjourney 레이아웃 조합을 유지하고 있나요?"
"Civitai는 기술 참고용으로만 사용하고 있나요?"
```

---

## 📝 **버전 및 업데이트 이력**

```yaml
Version 1.1.0: "2025-01-02"
  - 2025 최신 기술 스택 업데이트
  - Next.js 15.4.0-canary + React 19
  - TypeScript 5.9.2 + Tailwind CSS v4
  - Prisma ORM v6 + NextAuth.js v5

Version 1.0.0: "2025-01-01"
  - 초기 마스터 전략 문서 작성
  - 하이브리드 접근법 확정
  - 4단계 개발 로드맵 수립
  - 핵심 제약사항 및 원칙 정의

향후_업데이트:
  - 개발 진행에 따른 세부 조정
  - 성능 메트릭 업데이트
  - 새로운 기술적 발견사항 반영
  - 사용자 피드백 기반 개선사항
```

---

## 🎖️ **마스터 전략 요약**

> **"BlurBlur.ai의 혼 + Midjourney의 레이아웃 + Civitai의 기술"**

**🎨 겉모습**: BlurBlur.ai 완전 클론  
**🧱 내부**: Midjourney Masonry 엔진  
**⚙️ 뼈대**: Civitai 아키텍처 참고  

**⏱️ 목표**: 2-3개월 내 고품질 완성  
**🎯 결과**: 최고의 사용자 경험 + 검증된 안정성

---

**⚠️ 이 문서는 프로젝트의 나침반입니다. 모든 개발 결정은 이 전략에 부합해야 하며, 변경이 필요한 경우 반드시 이 문서를 먼저 업데이트해야 합니다.**