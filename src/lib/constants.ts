/**
 * 애플리케이션 전역 상수 관리
 * 성능 최적화와 타입 안전성을 위한 중앙집중식 상수 관리
 */

// 📊 성능 설정
export const PERFORMANCE_CONFIG = {
  // 이미지 최적화
  IMAGE_QUALITY: 90,
  WEBP_QUALITY: 85,
  THUMBNAIL_SIZES: [150, 300, 600] as const,
  LAZY_LOADING_THRESHOLD: 100,

  // 갤러리 성능
  MASONRY_COLUMNS: {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  } as const,

  // 비디오 설정
  VIDEO_AUTOPLAY_DELAY: 500,
  VIDEO_THUMBNAIL_QUALITY: 80,

  // 애니메이션 및 로딩
  DEBOUNCE_DELAY: 150,
  LOADING_DELAY: 300,
  ANIMATION_DURATION: 200
} as const

// 🔒 보안 설정
export const SECURITY_CONFIG = {
  // 파일 업로드 제한
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'] as const,

  // 보안 검증
  SUSPICIOUS_PATTERNS: ['.php', '.js', '.html', '.exe', '.bat', '.sh', '<script', 'javascript:'] as const,
  MIN_PASSWORD_LENGTH: 12,

  // Rate Limiting
  UPLOAD_RATE_LIMIT: 10, // requests per minute
  API_RATE_LIMIT: 100 // requests per minute
} as const

// 🎨 UI/UX 설정
export const UI_CONFIG = {
  // 브레이크포인트
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  } as const,

  // 색상 시스템
  COLORS: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#f5f5f5',
    background: '#ffffff',
    text: '#000000',
    muted: '#999999'
  } as const,

  // 타이포그래피
  TYPOGRAPHY: {
    heading: 'var(--font-libre-bodoni)',
    body: 'var(--font-jost)'
  } as const,

  // 간격 시스템
  SPACING: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  } as const
} as const

// 📱 반응형 설정
export const RESPONSIVE_CONFIG = {
  // 갤러리 그리드 설정
  GRID_COLUMNS: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    wide: 5,
    ultrawide: 6
  } as const,

  // 이미지 크기
  IMAGE_SIZES: {
    thumbnail: 300,
    medium: 800,
    large: 1200,
    xlarge: 1600
  } as const,

  // 미디어 쿼리
  MEDIA_QUERIES: {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    wide: '(min-width: 1280px)',
    ultrawide: '(min-width: 1536px)'
  } as const
} as const

// 🚀 API 설정
export const API_CONFIG = {
  // 엔드포인트
  ENDPOINTS: {
    SUPABASE_STORAGE: '/api/supabase/storage',
    ADMIN_AUTH: '/api/admin/auth',
    MEDIA_UPLOAD: '/api/media/upload',
    MEDIA_DELETE: '/api/media/delete'
  } as const,

  // 요청 설정
  TIMEOUT: 30000, // 30초
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // 페이지네이션
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const

// 📊 애널리틱스 설정
export const ANALYTICS_CONFIG = {
  // 이벤트 추적
  EVENTS: {
    PAGE_VIEW: 'page_view',
    IMAGE_VIEW: 'image_view',
    VIDEO_VIEW: 'video_view',
    DOWNLOAD: 'download',
    SEARCH: 'search',
    FILTER: 'filter'
  } as const,

  // 성능 모니터링
  PERFORMANCE_THRESHOLDS: {
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1   // Cumulative Layout Shift
  } as const
} as const

// 🌐 환경 설정
export const ENVIRONMENT_CONFIG = {
  // 로컬 개발
  LOCAL: {
    STORAGE_TYPE: 'indexeddb',
    DATABASE_NAME: 'tk-ai-gallery',
    VERSION: 1
  } as const,

  // 프로덕션
  PRODUCTION: {
    STORAGE_TYPE: 'supabase',
    CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN,
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID
  } as const,

  // 공통 설정
  COMMON: {
    APP_NAME: 'TK AI 모델 갤러리',
    VERSION: '1.0.0',
    AUTHOR: 'TK',
    REPOSITORY: 'https://github.com/mafiaboyhacker/tk-ai-model-gallery'
  } as const
} as const

// 📁 파일 시스템 설정
export const FILE_CONFIG = {
  // 디렉토리 구조
  DIRECTORIES: {
    UPLOADS: 'uploads',
    THUMBNAILS: 'thumbnails',
    TEMP: 'temp',
    CACHE: 'cache'
  } as const,

  // 파일명 패턴
  FILENAME_PATTERNS: {
    UUID: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    VARIATION: /_(\d+)$/,
    AI_TOOL: /^(u\d+|imgvnf|generation)/i
  } as const,

  // 메타데이터 추출
  METADATA_EXTRACTION: {
    AUTO_TITLE: true,
    AUTO_DESCRIPTION: true,
    AUTO_TAGS: true,
    AUTO_CATEGORY: true
  } as const
} as const

// 🎯 상태 관리 설정
export const STORE_CONFIG = {
  // Zustand 설정
  PERSIST_KEYS: {
    MEDIA: 'media-store',
    USER: 'user-store',
    UI: 'ui-store'
  } as const,

  // 캐시 설정
  CACHE_DURATION: {
    SHORT: 5 * 60 * 1000,    // 5분
    MEDIUM: 30 * 60 * 1000,  // 30분
    LONG: 24 * 60 * 60 * 1000 // 24시간
  } as const,

  // 동기화 설정
  SYNC_INTERVAL: 30000, // 30초
  MAX_RETRY_ATTEMPTS: 5
} as const

// 🔄 타입 안전성을 위한 유틸리티 타입
export type PerformanceConfig = typeof PERFORMANCE_CONFIG
export type SecurityConfig = typeof SECURITY_CONFIG
export type UIConfig = typeof UI_CONFIG
export type ResponsiveConfig = typeof RESPONSIVE_CONFIG
export type APIConfig = typeof API_CONFIG
export type AnalyticsConfig = typeof ANALYTICS_CONFIG
export type EnvironmentConfig = typeof ENVIRONMENT_CONFIG
export type FileConfig = typeof FILE_CONFIG
export type StoreConfig = typeof STORE_CONFIG

// 📈 성능 최적화를 위한 상수 그룹화
export const CONFIG = {
  PERFORMANCE: PERFORMANCE_CONFIG,
  SECURITY: SECURITY_CONFIG,
  UI: UI_CONFIG,
  RESPONSIVE: RESPONSIVE_CONFIG,
  API: API_CONFIG,
  ANALYTICS: ANALYTICS_CONFIG,
  ENVIRONMENT: ENVIRONMENT_CONFIG,
  FILE: FILE_CONFIG,
  STORE: STORE_CONFIG
} as const

export default CONFIG