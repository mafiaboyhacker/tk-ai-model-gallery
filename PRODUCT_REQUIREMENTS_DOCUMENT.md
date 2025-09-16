# 📋 AI 모델 갤러리 - PRD (Product Requirements Document)

> **Document Version**: 2.0.0  
> **Last Updated**: 2025-09-01  
> **Status**: Draft → Review → **Final** → **실제 데이터 반영 완료**

---

## 🎯 **제품 개요 (Product Overview)**

### 📋 **제품 정의**
**BlurBlur.ai 스타일의 AI 모델 갤러리 웹사이트** - Midjourney 레이아웃 시스템을 적용한 전문적인 AI 모델 쇼케이스 플랫폼

### 🎨 **핵심 가치 제안 (Value Proposition)**
- **전문적 큐레이션**: 관리자만 업로드 가능한 고품질 모델 컬렉션
- **최적화된 탐색**: Masonry 레이아웃으로 다양한 크기의 이미지 완벽 표시
- **직관적 UX**: BlurBlur.ai 수준의 세련된 사용자 인터페이스
- **효율적 문의**: 체계화된 4단계 비즈니스 문의 시스템

### 🏆 **성공 지표 (Success Metrics)**
```yaml
비즈니스 지표:
  - 월간 활성 사용자(MAU): 10,000+
  - 문의 전환율: 5%+
  - 평균 세션 시간: 3분+
  - 페이지 뷰 per 세션: 5+

기술 지표:
  - 페이지 로딩 속도: < 2.5초
  - 모바일 사용성 점수: 95/100
  - Core Web Vitals: 모든 지표 Good
  - 가동 시간: 99.9%+
```

---

## 👥 **사용자 정의 (User Definition)**

### 🎭 **주요 페르소나**

#### **1차 사용자: 비즈니스 고객** 👔
```yaml
프로필:
  - 역할: 마케팅/광고 대행사, 브랜드 매니저
  - 연령: 25-45세
  - 기술 수준: 중급
  - 목적: 상업적 AI 모델 구매/라이선스

사용 시나리오:
  - 특정 타겟 대상(Asian, Europe 등) 모델 검색
  - 산업별(Fashion, Cosmetics 등) 모델 필터링
  - 모델 상세 정보 확인 및 라이선스 문의
  - 대량 구매 또는 커스텀 모델 제작 의뢰

니즈:
  - 빠른 모델 검색 및 비교
  - 명확한 라이선스 정보
  - 전문적인 문의 채널
  - 고해상도 미리보기
```

#### **2차 사용자: 개인 크리에이터** 🎨
```yaml
프로필:
  - 역할: 디자이너, 콘텐츠 크리에이터, 개발자
  - 연령: 20-40세  
  - 기술 수준: 중-고급
  - 목적: 개인 프로젝트용 AI 모델 활용

사용 시나리오:
  - 트렌드 AI 모델 탐색
  - 특정 스타일/무드의 모델 발견
  - 모델 다운로드 또는 사용 문의
  - 영감 얻기 및 참고자료 수집

니즈:
  - 다양한 스타일 모델 탐색
  - 직관적인 브라우징 경험
  - 고품질 이미지 확인
  - 간편한 저장/공유 기능
```

#### **시스템 관리자: 사이트 운영자** ⚙️
```yaml
프로필:
  - 역할: 콘텐츠 큐레이터, 시스템 관리자
  - 목적: 고품질 모델 컬렉션 관리

관리 기능:
  - 모델 업로드 및 메타데이터 입력
  - 카테고리 분류 및 태그 관리  
  - 문의 처리 및 고객 응대
  - 사이트 성능 모니터링
```

---

## 🏗️ **기능 요구사항 (Functional Requirements)**

### 🌟 **핵심 기능 (Core Features)**

#### **1. 모델 갤러리 시스템** 🖼️
```yaml
갤러리 레이아웃:
  type: "Masonry Grid (Midjourney 스타일)"
  responsive_columns:
    mobile: 2
    tablet: 3  
    desktop: 4-5
    large_desktop: 5-6
  
이미지 처리:
  formats: ["WebP", "JPEG"]
  loading: "Progressive + Lazy Loading"
  optimization: "Multi-size responsive images"
  
상호작용:
  - 이미지 호버 효과 (제목, 카테고리 표시)
  - 클릭 시 모델 상세 페이지 이동
  - 무한 스크롤 또는 페이지네이션
  - 이미지 확대/축소 (라이트박스)
```

#### **2. 검색 및 필터링** 🔍
```yaml
검색 기능:
  - 텍스트 검색 (모델명, 설명, 태그)
  - 실시간 검색 제안 (Auto-complete)
  - 검색 히스토리
  
필터링 옵션:
  demographic_filters:
    - Asian
    - Europe  
    - Africa America
    - Hispanic
    - Special (동물형, 판타지형, 캐릭터형)
    
  industry_filters:
    - Fashion (패션, 하이패션)
    - Cosmetics (화장품, 뷰티)
    - Leisure/Sports (레저, 스포츠, 피트니스)
    - Digital/Electronics (디지털, 가전)
    - Furniture/Interior (가구, 인테리어)  
    - Food (푸드, 웰니스)
    - Lifestyle (라이프스타일, 광고)
    - Music/Arts (음악, 악기, 액세서리)
    
  additional_filters:
    - 이미지 비율 (세로형/가로형/정사각형)
    - 업로드 날짜
    - 인기도/조회수
    - 색상 팔레트
    
정렬 옵션:
  - 최신순
  - 인기순 (조회수, 좋아요)
  - 이름순
  - 카테고리순
```

#### **3. 모델 상세 페이지** 📄
```yaml
정보 표시:
  basic_info:
    - 모델명 (한글/영문)
    - 카테고리 및 산업 태그
    - 업로드 날짜
    - 해상도 및 파일 정보
    
  metadata:
    - 추천 활용 분야
    - 무드/분위기 태그
    - 색상 팔레트 정보
    - 스타일 키워드
    - 사용 라이선스 정보
    
  engagement_data:
    - 조회수
    - 좋아요 수 (선택적)
    - 공유 기능
    
  related_content:
    - 동일 카테고리 모델 추천
    - 유사한 스타일 모델
    - 같은 색상 팔레트 모델
```

#### **4. 비즈니스 문의 시스템** 📞
```yaml
4단계 문의 프로세스:
  step_1: "문의 유형 선택"
    options:
      - 모델 이미지 구매
      - 신규 모델 제작 의뢰
      - 라이선스 문의
      - 기타 문의
      
  step_2: "모델 선택"
    features:
      - 드롭다운 카테고리 선택
      - 모델 썸네일 그리드 표시
      - 검색 기능
      - 다중 선택 가능
      
  step_3: "상세 요구사항"
    fields:
      - 카테고리: Fashion/Beauty/Leisure/Digital/Furniture/기타
      - 이미지 컷 수: 숫자 입력
      - 사용 용도: 텍스트 입력
      - 납기일: 날짜 선택기
      - 예산 범위: 드롭다운 선택
      - 상세 내용: 장문 텍스트 에리어
      - 참고 파일: 파일 업로드 (최대 3개, 20MB)
      
  step_4: "의뢰자 정보"
    required_fields:
      - 이름*
      - 회사명*  
      - 사업자등록번호*
      - 연락처*
      - 이메일*
    optional_fields:
      - 회사 홈페이지
      - 추가 연락처
    legal:
      - 개인정보 수집 및 이용 동의*
      - 마케팅 정보 수신 동의 (선택)
```

### 🎨 **사용자 인터페이스 요구사항**

#### **디자인 시스템** 🎨
```yaml
color_palette:
  primary: "#ffffff"      # 화이트 베이스
  surface: "#f8f9fa"      # 카드 배경
  text_primary: "#000000" # 기본 텍스트
  text_secondary: "#6c757d" # 보조 텍스트
  accent_primary: "#667eea"   # 블루 그라데이션
  accent_secondary: "#764ba2" # 퍼플 그라데이션
  highlight: "#ff6b6b"        # 강조 색상

typography:
  font_family: "'Inter', system-ui, sans-serif"
  heading_xl: "48px/1.2, 700 weight"
  heading_lg: "32px/1.3, 600 weight"  
  heading_md: "24px/1.4, 600 weight"
  body_lg: "18px/1.5, 400 weight"
  body_md: "16px/1.5, 400 weight"
  body_sm: "14px/1.5, 400 weight"

components:
  cards:
    border_radius: "12px"
    shadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
    hover_transform: "translateY(-8px)"
    transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    
  buttons:
    primary: "그라데이션 배경 + 흰색 텍스트"  
    secondary: "투명 배경 + 테두리 + 그라데이션 텍스트"
    border_radius: "8px"
    padding: "12px 24px"
    
  inputs:
    background: "rgba(255, 255, 255, 0.1)"
    border: "1px solid rgba(255, 255, 255, 0.2)"
    focus_border: "그라데이션 테두리"
    border_radius: "8px"
```

#### **반응형 디자인** 📱
```yaml
breakpoints:
  mobile: "320px - 767px"
  tablet: "768px - 1023px"  
  desktop: "1024px - 1439px"
  large_desktop: "1440px - 1919px"
  xl_desktop: "1920px+"

responsive_behavior:
  navigation:
    mobile: "햄버거 메뉴 + 사이드바"
    desktop: "상단 네비게이션 바"
    
  gallery:
    mobile: "2열 그리드, 16px 간격"
    tablet: "3열 그리드, 20px 간격"
    desktop: "4-5열 그리드, 24px 간격"
    
  typography:
    mobile: "16px 기준, 작은 heading"
    desktop: "18px 기준, 큰 heading"
```

---

## 🔐 **관리자 전용 기능 (Admin Features)**

### 🚪 **접근 제어 시스템**
```yaml
인증 레벨:
  public_user: "갤러리 조회, 문의 작성"
  admin_user: "모든 콘텐츠 관리 권한"
  
admin_authentication:
  method: "이메일 + 패스워드"
  security: 
    - 2FA (Two-Factor Authentication) 필수
    - 세션 타임아웃: 2시간
    - IP 화이트리스트 (선택적)
    - 로그인 시도 제한: 5회
    
admin_permissions:
  content_management:
    - 모델 업로드/수정/삭제
    - 카테고리 관리
    - 태그 및 메타데이터 편집
  system_management:
    - 문의 관리 및 응답
    - 사용자 분석 대시보드
    - 시스템 설정 관리
```

### 📤 **모델 업로드 시스템** (관리자 전용)
```yaml
업로드 인터페이스:
  file_upload:
    supported_formats: ["JPEG", "PNG", "WebP", "MP4"]
    max_file_size: "20MB per image, 60MB per video"
    batch_upload: "최대 600개 파일 일괄 업로드 지원"
    drag_and_drop: true
    folder_upload: "폴더 전체 드래그앤드롭 지원"
    
  metadata_input:
    auto_extraction:
      - 파일명에서 영문 프롬프트 자동 추출
      - AI 생성 도구 자동 식별 (u3934589919, imgvnf, generation 등)
      - 이미지 해상도 및 비율 자동 감지
      - 동일 시리즈 변형 자동 그룹핑
      - 색상 팔레트 자동 추출
      
    required_fields:
      - 모델명 (한글)* [자동 제안 + 수동 수정]
      - 모델명 (영문)* [파일명에서 자동 추출]
      - 카테고리 (demographic)* [수동 선택]
      - 산업 분야 (industry)* [키워드 기반 자동 제안]
      - 설명 (한글)* [영문에서 번역 제안]
      - 설명 (영문)* [파일명에서 자동 추출]
      
    optional_fields:
      - 무드/분위기 태그 (프롬프트 기반 자동 제안)
      - 색상 팔레트 (자동 추출 + 수동 조정)
      - 추천 활용 분야 (키워드 기반 제안)
      - 스타일 키워드 (프롬프트에서 자동 추출)
      - 라이선스 유형
      - 가격 정보 (비공개)
      
  processing:
    image_optimization: 
      - WebP 변환 (30-50% 용량 절약)
      - 다중 해상도 생성 (150px, 300px, 600px, 원본)
      - 자동 썸네일 생성
      - 색상 팔레트 자동 추출
    
    video_processing:
      - MP4 H.264 인코딩 표준화
      - 썸네일 프레임 자동 추출 (0초, 중간, 마지막)
      - 다중 해상도 변환 (720p, 1080p)
      - 비디오 메타데이터 추출 (길이, 해상도, 프레임율)
    
    quality_control:
      - 중복 파일 감지 (해시 기반)
      - 파일 무결성 검증
      - 악성 파일 스캔
      - 최적화 품질 검증

bulk_management:
  large_scale_upload:
    - 폴더 전체 업로드 (600+ 파일 지원)
    - 파일명 패턴 기반 자동 분류
    - 진행률 실시간 표시
    - 업로드 실패 파일 재시도 기능
    - 백그라운드 처리 (사용자는 다른 작업 가능)
    
  batch_operations:
    - 다중 선택 편집 (최대 100개 동시)
    - 일괄 카테고리 변경
    - 일괄 태그 추가/제거
    - 스마트 태그 일괄 적용 (AI 기반 제안)
    - 일괄 삭제 (복구 가능)
    
  import_export:
    - CSV 메타데이터 가져오기/내보내기
    - 폴더 구조 기반 일괄 업로드
    - 파일명 패턴 매핑 설정
    - 업로드 로그 및 결과 보고서
```

### 📊 **관리자 대시보드**
```yaml
analytics_dashboard:
  traffic_metrics:
    - 일/주/월별 방문자 수
    - 인기 모델 순위
    - 카테고리별 조회 통계
    - 검색 키워드 분석
    
  business_metrics:
    - 문의 접수 현황
    - 문의 유형별 통계  
    - 응답 시간 추적
    - 전환율 분석
    
  system_metrics:
    - 서버 성능 모니터링
    - 이미지 최적화 상태
    - 스토리지 사용량
    - 에러 로그 모니터링

content_management:
  model_overview:
    - 총 모델 수 및 카테고리별 분포
    - 최근 업로드 모델
    - 인기 모델 순위
    - 미처리 모델 대기열
    
  inquiry_management:
    - 신규 문의 알림
    - 문의 상태 관리 (접수/처리중/완료)
    - 고객 정보 및 요구사항 조회
    - 응답 템플릿 관리
```

---

## ⚡ **비기능적 요구사항 (Non-Functional Requirements)**

### 🚀 **성능 요구사항**
```yaml
응답 시간:
  page_load: "< 2.5초 (3G 네트워크 기준)"
  image_load: "< 1초 (첫 화면 이미지)"
  api_response: "< 500ms (일반 API 호출)"
  search_results: "< 300ms (검색 결과 표시)"

처리량:
  concurrent_users: "1,000명 동시 접속 지원"
  daily_pageviews: "100,000 페이지뷰 처리 가능"
  file_upload: "동시 10개 파일 업로드 지원"

scalability:
  horizontal_scaling: "로드 밸런서를 통한 서버 확장"
  database_scaling: "읽기 복제를 통한 쿼리 성능 향상"  
  cdn_integration: "전 세계 이미지 캐싱"
```

### 🔒 **보안 요구사항**
```yaml
data_protection:
  encryption:
    - HTTPS 강제 적용
    - 데이터베이스 암호화 (AES-256)
    - 파일 저장소 암호화
    
  access_control:
    - JWT 토큰 기반 인증
    - 역할 기반 접근 제어 (RBAC)
    - API Rate Limiting
    
  file_security:
    - 파일 타입 검증
    - 악성 코드 스캔
    - 파일 크기 제한
    - 업로드 경로 격리

privacy:
  data_handling:
    - 개인정보 최소 수집
    - 쿠키 정책 준수
    - GDPR 컴플라이언스 (EU 사용자)
    - 데이터 보관 기간 설정
```

### 📱 **사용성 요구사항**
```yaml
accessibility:
  wcag_compliance: "WCAG 2.1 AA 수준 준수"
  features:
    - 키보드 네비게이션 지원
    - 스크린 리더 호환
    - 색상 대비 4.5:1 이상
    - 포커스 표시 명확화
    - Alt 텍스트 제공

browser_support:
  desktop:
    - Chrome 90+
    - Firefox 88+  
    - Safari 14+
    - Edge 90+
  mobile:
    - iOS Safari 14+
    - Chrome Mobile 90+
    - Samsung Internet 14+

multilingual:
  primary_language: "한국어"
  secondary_language: "영어 (모델명, 설명)"
  interface: "한국어 우선, 영어 대체"
```

### 🛠️ **운영 요구사항**
```yaml
availability:
  uptime: "99.9% (월 8.7시간 다운타임 허용)"
  maintenance_window: "매주 일요일 02:00-04:00 KST"
  disaster_recovery: "24시간 내 복구"

monitoring:
  application_monitoring:
    - 실시간 성능 지표 추적
    - 에러 로그 수집 및 알림
    - 사용자 행동 분석
    
  infrastructure_monitoring:  
    - 서버 리소스 모니터링
    - 데이터베이스 성능 추적
    - CDN 캐시 효율성 분석

backup_strategy:
  database_backup: "일 1회 자동 백업"
  file_backup: "실시간 동기화 백업"  
  retention_period: "30일간 백업 보관"
```

---

## 🔧 **기술적 구현 결정사항**

### 🏗️ **아키텍처 선택: 하이브리드 접근법**

#### **프론트엔드: 직접 개발** ✨
```yaml
선택 이유:
  - BlurBlur.ai 디자인 100% 정확 구현 필요
  - Midjourney Masonry 레이아웃 정밀 제어
  - 관리자 전용 업로드 UI 커스터마이징
  - 성능 최적화 완전 통제

기술 스택:
  framework: "Next.js 15.4.0-canary (App Router + React 19)"
  language: "TypeScript 5.9.2"
  styling: "Tailwind CSS v4 + CSS Modules"
  layout_engine: "react-responsive-masonry"
  state_management: "Zustand + React Query"
  ui_components: "Headless UI + Custom Components"
  animation: "Framer Motion"
  
구현 범위:
  - 모든 UI 컴포넌트 직접 제작
  - Masonry 레이아웃 엔진 통합
  - 관리자 인터페이스 구축
  - 반응형 디자인 구현
  - 접근성 기능 내장
```

#### **백엔드: Civitai 구조 참고** 🔧
```yaml
선택 이유:
  - 검증된 AI 모델 갤러리 아키텍처
  - 복잡한 파일 업로드 로직 재사용
  - 이미지 처리 파이프라인 활용
  - 개발 시간 대폭 단축

참고 범위:
  - 데이터베이스 스키마 설계 패턴
  - API 엔드포인트 구조
  - 파일 업로드 및 처리 로직
  - 인증 및 권한 관리 시스템
  - 이미지 최적화 워크플로우

기술 스택:
  api: "Next.js 15.4.0 API Routes (서버리스)"
  database: "PostgreSQL + Prisma ORM v6"  
  authentication: "NextAuth.js v5 + JWT"
  file_storage: "AWS S3 + CloudFront CDN"
  file_processing: "Sharp.js (이미지) + FFmpeg (비디오) + AWS Lambda"
  email_service: "SendGrid"
```

### 🔐 **관리자 전용 업로드 시스템 구현**

#### **인증 시스템: 직접 구현** 🚪
```yaml
구현 이유:
  - 단순한 관리자 전용 시스템 (복잡한 사용자 관리 불필요)
  - 보안 요구사항 정확 충족
  - 커스터마이징 용이성

기술 선택:
  authentication: "NextAuth.js (Credentials Provider)"
  authorization: "Role-based (admin/user)"
  session_management: "JWT + Refresh Token"
  security_features:
    - 2FA 지원 (Google Authenticator)
    - 세션 타임아웃
    - IP 기반 접근 제어 (선택적)
    - 로그인 시도 제한

관리자 인터페이스:
  admin_panel: "Next.js 15.4.0 Admin Pages (SSR)"
  file_upload: "직접 구현 (Drag & Drop + Progress)"
  bulk_operations: "React 19 커스텀 컴포넌트"
  dashboard: "Chart.js + 커스텀 메트릭스"
```

#### **파일 업로드: 하이브리드 방식** 📤
```yaml
클라이언트 업로드:
  technology: "React 19 Dropzone + Presigned URLs"
  features:
    - 드래그 앤 드롭 인터페이스
    - 진행률 표시
    - 일괄 업로드 (최대 50개)
    - 미리보기 생성
    - 파일 검증 (타입, 크기)

서버 처리:
  reference: "Civitai 파일 처리 파이프라인 + 대용량 배치 처리"
  image_pipeline:
    1. 파일 검증 및 보안 스캔
    2. WebP 최적화 (30-50% 용량 절약)
    3. 다중 해상도 생성 (150px, 300px, 600px, 원본)
    4. 썸네일 자동 생성
    5. 색상 팔레트 자동 추출
    6. 파일명 파싱으로 메타데이터 추출
    
  video_pipeline:
    1. MP4 파일 검증 및 메타데이터 추출
    2. H.264 인코딩 표준화
    3. 썸네일 프레임 추출 (0초, 중간, 마지막)
    4. 다중 해상도 변환 (720p, 1080p)
    5. 비디오 길이 및 해상도 정보 저장
    
  batch_processing:
    - 600+ 파일 대용량 일괄 처리 지원
    - 큐 시스템으로 순차 처리
    - 실패 파일 자동 재시도
    - 진행률 실시간 업데이트
    
  storage_strategy:
    primary: "AWS S3 (원본 + 최적화 파일 저장)"
    cdn: "CloudFront (전 세계 배포)"
    backup: "다중 리전 복제"
    estimated_cost: "$0.12/월 (1GB 기준, 실제 데이터 1.47GB → 최적화 후 1.03GB)"
```

---

## 📊 **데이터 모델 설계**

### 🗃️ **데이터베이스 스키마 (Civitai 참고)**
```typescript
// 핵심 데이터 모델
interface AIModel {
  id: string;
  name_ko: string;        // 한글 이름
  name_en: string;        // 영문 이름  
  description_ko: string;  // 한글 설명
  description_en: string;  // 영문 설명
  
  // 분류 정보
  demographic: 'ASIAN' | 'EUROPE' | 'AFRICA_AMERICA' | 'HISPANIC' | 'SPECIAL';
  industry: 'FASHION' | 'COSMETICS' | 'LEISURE_SPORTS' | 'DIGITAL_ELECTRONICS' | 
           'FURNITURE_INTERIOR' | 'FOOD' | 'LIFESTYLE' | 'MUSIC_ARTS';
  
  // 파일 정보 (이미지/비디오 통합)
  file_type: 'IMAGE' | 'VIDEO';
  file_url: string;       // 원본 파일 URL
  file_width: number;     // 원본 너비
  file_height: number;    // 원본 높이
  file_size: number;      // 파일 크기 (bytes)
  responsive_images: ResponsiveImage[]; // 다중 해상도 (이미지)
  video_thumbnails: VideoThumbnail[];   // 비디오 썸네일들
  
  // 자동 추출된 메타데이터
  original_filename: string;     // 원본 파일명
  ai_generation_tool: string;    // 생성 도구 (u3934589919, imgvnf, generation)
  extracted_prompt: string;      // 파일명에서 추출한 프롬프트
  series_uuid: string;          // 동일 시리즈 그룹핑 UUID
  variation_number: number;     // 변형 번호 (_0, _1, _2, _3)
  
  // 메타데이터
  tags: string[];         // 스타일 키워드
  mood_tags: string[];    // 무드/분위기
  color_palette: string[]; // 색상 팔레트 (HEX)
  recommended_use: string; // 추천 활용 분야
  license_type: string;   // 라이선스 정보
  
  // 상태 및 통계
  is_published: boolean;  // 공개 여부
  is_featured: boolean;   // 특별 하이라이트
  upload_date: Date;      // 업로드 날짜
  view_count: number;     // 조회수
  like_count: number;     // 좋아요 수 (선택적)
  
  // 관계 데이터
  uploaded_by: string;    // 업로드한 관리자 ID
  category_themes: ThemeModel[]; // 테마 연결
}

interface ContactInquiry {
  id: string;
  
  // 문의 분류
  inquiry_type: 'MODEL_PURCHASE' | 'CUSTOM_MODEL' | 'LICENSE_INQUIRY' | 'OTHER';
  selected_models: string[];  // 선택한 모델 ID들
  
  // 요구사항 정보
  category: string;       // 관심 카테고리
  image_count: number;    // 필요한 이미지 수
  use_purpose: string;    // 사용 용도
  deadline: Date;         // 납기일
  budget_range: string;   // 예산 범위
  detailed_request: string; // 상세 요청사항
  reference_files: string[]; // 첨부 파일 URLs
  
  // 의뢰자 정보
  client_name: string;    // 이름
  company_name: string;   // 회사명
  business_number: string; // 사업자등록번호
  phone: string;          // 연락처
  email: string;          // 이메일
  company_website?: string; // 회사 홈페이지 (선택)
  additional_contact?: string; // 추가 연락처 (선택)
  
  // 동의 및 상태
  privacy_consent: boolean;    // 개인정보 동의
  marketing_consent: boolean;  // 마케팅 동의 (선택)
  status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
  
  // 관리자 응답
  admin_response?: string;     // 관리자 답변
  response_date?: Date;        // 답변 날짜
  assigned_admin?: string;     // 담당 관리자
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CONTENT_ADMIN';
  is_active: boolean;
  last_login: Date;
  created_at: Date;
  
  // 2FA 설정
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  
  // IP 제한 (선택적)
  allowed_ips?: string[];
}
```

---

## 🚀 **구현 로드맵**

### 📅 **상세 개발 일정**

#### **Phase 1: 기반 구축** (2주)
```yaml
Week 1: "환경 설정 및 분석"
  Days 1-3:
    - Civitai 코드베이스 심층 분석
    - 데이터베이스 스키마 설계
    - 프로젝트 초기화 및 환경 설정
    
  Days 4-7:
    - BlurBlur.ai 디자인 시스템 구축
    - Tailwind CSS 커스터마이징
    - 기본 라우팅 및 레이아웃 설정

Week 2: "인증 및 관리자 시스템"
  Days 1-3:
    - NextAuth.js 인증 시스템 구현
    - 관리자 권한 시스템 구축
    - 2FA 구현
    
  Days 4-7:
    - 관리자 대시보드 기본 구조
    - 데이터베이스 연동 (Prisma)
    - 기본 API 엔드포인트 구현
```

#### **Phase 2: 핵심 기능 개발** (4주)
```yaml
Week 3-4: "대용량 업로드 시스템"
  - AWS S3 연동 및 Presigned URL 설정
  - 폴더 드래그앤드롭 인터페이스 (600+ 파일 지원)
  - 파일명 패턴 파싱 시스템 구축
  - 이미지 최적화 파이프라인 (Sharp.js)
  - 비디오 처리 파이프라인 (FFmpeg)
  - 자동 메타데이터 추출 시스템
  - 배치 처리 큐 시스템

Week 5-6: "갤러리 및 검색 시스템"  
  - Masonry 레이아웃 구현 (이미지/비디오 통합)
  - 비디오 썸네일 및 재생 인터페이스
  - 무한 스크롤 또는 페이지네이션
  - 검색 및 필터링 API (파일 유형별)
  - 모델 상세 페이지 (이미지/비디오 구분)
  - 반응형 미디어 로딩
```

#### **Phase 3: 사용자 기능 완성** (3주)
```yaml
Week 7-8: "문의 시스템 구현"
  - 4단계 문의 프로세스 UI
  - 문의 데이터 저장 및 관리
  - 이메일 알림 시스템 (SendGrid)
  - 관리자 문의 처리 인터페이스

Week 9: "추가 기능 및 최적화"
  - 테마/컬렉션 시스템
  - 이미지 라이트박스
  - 공유 기능
  - 성능 최적화 (이미지 lazy loading, 번들 최적화)
```

#### **Phase 4: 테스트 및 배포** (2주)
```yaml
Week 10: "테스트 및 버그 수정"
  - 단위 테스트 작성 (Jest)
  - E2E 테스트 (Playwright)  
  - 접근성 테스트
  - 성능 테스트 및 최적화

Week 11: "배포 준비 및 런칭"
  - 프로덕션 환경 설정
  - CI/CD 파이프라인 구축
  - 모니터링 및 로깅 설정
  - 도메인 연결 및 SSL 설정
  - 소프트 런칭 및 피드백 수집
```

---

## 📋 **수용 기준 (Acceptance Criteria)**

### ✅ **기능적 수용 기준**
```yaml
갤러리 시스템:
  - [ ] Masonry 레이아웃이 다양한 이미지 비율을 자연스럽게 처리
  - [ ] 모바일에서 2열, 데스크톱에서 4-5열 반응형 동작
  - [ ] 이미지 lazy loading으로 초기 로딩 속도 2.5초 이내
  - [ ] 무한 스크롤 또는 페이지네이션으로 1000개 이상 이미지 처리

검색 및 필터링:
  - [ ] 텍스트 검색 결과가 0.3초 이내 표시
  - [ ] 카테고리 필터링이 정확히 작동
  - [ ] 다중 필터 조합 검색 지원
  - [ ] 검색 결과가 없을 때 적절한 메시지 표시

관리자 기능:
  - [ ] 관리자만 파일 업로드 가능 (인증 필수)
  - [ ] 폴더 드래그앤드롭으로 600+ 파일 일괄 업로드
  - [ ] 이미지 자동 최적화 (WebP 변환) + 비디오 처리 (FFmpeg)
  - [ ] 파일명에서 메타데이터 자동 추출
  - [ ] 메타데이터 일괄 편집 가능

문의 시스템:
  - [ ] 4단계 문의 프로세스가 순서대로 진행
  - [ ] 필수 입력 항목 검증 작동
  - [ ] 파일 첨부 (최대 3개, 20MB) 정상 작동
  - [ ] 문의 접수 시 관리자에게 이메일 알림
```

### 🎯 **성능 수용 기준**
```yaml
속도:
  - [ ] 첫 페이지 로딩: 2.5초 이내 (3G 기준)
  - [ ] 이미지 표시: 1초 이내 (viewport 내)
  - [ ] API 응답: 500ms 이내 (일반 요청)
  - [ ] 검색 결과: 300ms 이내

사용성:
  - [ ] WCAG 2.1 AA 수준 접근성 준수
  - [ ] 키보드만으로 모든 기능 사용 가능
  - [ ] 모바일 터치 인터페이스 44px 이상
  - [ ] 색상 대비 4.5:1 이상

신뢰성:
  - [ ] 99.9% 가동 시간 (월 8.7시간 다운타임 허용)
  - [ ] 파일 업로드 실패율 1% 이하
  - [ ] 이미지 로딩 실패 시 적절한 fallback 표시
```

### 🔒 **보안 수용 기준**
```yaml
인증 보안:
  - [ ] 관리자 로그인에 2FA 필수
  - [ ] 비밀번호 정책 준수 (8자 이상, 특수문자 포함)
  - [ ] 5회 로그인 실패 시 계정 잠금
  - [ ] 세션 타임아웃 2시간

파일 보안:
  - [ ] 업로드 파일 타입 검증 (이미지만 허용)
  - [ ] 파일 크기 제한 (20MB) 강제
  - [ ] 악성 파일 스캔 통과
  - [ ] 업로드 경로 외부 접근 차단

데이터 보안:
  - [ ] HTTPS 강제 적용
  - [ ] 민감 정보 암호화 저장
  - [ ] SQL Injection 방어
  - [ ] XSS 공격 방어
```

---

## 📊 **성공 지표 및 KPI**

### 📈 **출시 후 30일 목표**
```yaml
사용자 지표:
  - 일간 활성 사용자(DAU): 500명
  - 월간 활성 사용자(MAU): 5,000명
  - 평균 세션 시간: 3분 이상
  - 바운스율: 60% 이하

비즈니스 지표:
  - 문의 접수: 주당 20건 이상
  - 문의 전환율: 2% 이상 (방문자 대비)
  - 문의 응답 시간: 24시간 이내
  - 고객 만족도: 4.0/5.0 이상

기술 지표:
  - Core Web Vitals: 모든 지표 Good
  - 가동 시간: 99.9% 이상
  - 이미지 최적화율: 90% 이상 WebP 변환
  - API 응답 시간: 평균 300ms 이하
```

### 📊 **장기 목표 (6개월)**
```yaml
성장 지표:
  - MAU: 20,000명
  - 모델 업로드 수: 5,000개 이상
  - 카테고리별 모델 균등 분포 (각 카테고리 300개 이상)
  - 해외 사용자 비율: 20% 이상

품질 지표:
  - 고품질 모델 큐레이션 유지
  - 사용자 재방문율: 40% 이상  
  - 평균 탐색 깊이: 5페이지 이상
  - 문의 품질 개선 (명확한 요구사항 80% 이상)
```

---

## 🎯 **결론 및 다음 단계**

### ✅ **PRD v2.0 - 실제 데이터 반영 완료**
**주요 업데이트 사항:**
- ✅ **비디오 파일(.mp4) 지원** - 실제 데이터의 16%가 비디오
- ✅ **대용량 배치 업로드** - 601개 파일 일괄 처리 지원
- ✅ **자동 메타데이터 추출** - 파일명 패턴 분석으로 자동화
- ✅ **비디오 처리 파이프라인** - FFmpeg 기반 썸네일 추출
- ✅ **실제 용량 계획** - 1.47GB → 최적화 후 1.03GB

### 📋 **PRD 승인 후 즉시 진행사항**
1. **개발팀 구성** - 프론트엔드, 백엔드, DevOps 역할 분담
2. **Civitai 코드 분석** - 3일간 집중 분석 및 활용 가능 코드 추출
3. **개발 환경 구축** - Next.js 15.4.0, PostgreSQL, AWS 계정 설정
4. **디자인 시스템 구축** - BlurBlur.ai 컬러/폰트 시스템 재현
5. **파일명 파싱 로직 구현** - 실제 파일 패턴 기반 메타데이터 추출

### 🚀 **성공을 위한 핵심 요소**
- **정확한 UI 복제**: BlurBlur.ai 디자인 100% 재현
- **완벽한 Masonry**: Midjourney 수준의 이미지 배치
- **관리자 중심 설계**: 쉽고 효율적인 콘텐츠 관리
- **성능 우선**: 빠른 로딩과 부드러운 사용자 경험

이 PRD를 기반으로 **2-3개월 내에 고품질의 AI 모델 갤러리**를 성공적으로 런칭할 수 있습니다! 🎉

---

**문서 상태**: ✅ **최종 승인 대기**  
**다음 액션**: 개발팀 킥오프 미팅 및 Phase 1 시작