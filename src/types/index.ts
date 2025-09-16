/**
 * 애플리케이션 전역 타입 정의
 * TypeScript 타입 안전성과 IntelliSense 지원을 위한 중앙집중식 타입 관리
 */

// 📊 미디어 관련 타입
export interface Media {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string
  imageAlt: string
  category: string
  width: number
  height: number
  type?: 'image' | 'video'
  duration?: number
  resolution?: string
}

export interface GalleryMediaData {
  id: string
  fileName: string
  url: string
  originalUrl?: string
  type: 'image' | 'video'
  width: number
  height: number
  duration?: number
  resolution?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MediaUploadData {
  file: File
  fileName: string
  type: 'image' | 'video'
  preview?: string
  metadata?: MediaMetadata
}

export interface MediaMetadata {
  aiGenerationTool?: string
  extractedPrompt?: string
  seriesUuid?: string
  variationNumber?: number
  category?: Category
  tags?: string[]
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
  fileSize: number
}

// 🎯 스토어 관련 타입
export interface MediaStore {
  media: GalleryMediaData[]
  isLoading: boolean
  error: string | null
  selectedMedia: GalleryMediaData | null

  // 기본 작업
  addMedia: (files: File[]) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  updateMedia: (id: string, updates: Partial<GalleryMediaData>) => Promise<void>
  loadMedia: () => Promise<void>
  clearMedia: () => Promise<void>

  // 검색 및 필터링
  searchMedia: (query: string) => GalleryMediaData[]
  filterByType: (type: 'image' | 'video' | 'all') => GalleryMediaData[]
  filterByCategory: (category: string) => GalleryMediaData[]

  // 정렬 및 배치
  sortMedia: (by: SortBy, order: SortOrder) => void
  shuffleMedia: () => void
  getRandomMedia: (count: number) => GalleryMediaData[]
  getFeaturedMedia: () => GalleryMediaData[]

  // 비율 기반 배치
  arrangeByRatio?: () => void
  shuffleByMode?: () => void
  updateRatioConfig?: (config: Partial<RatioConfig>) => void
  ratioConfig?: RatioConfig

  // 통계
  getStats: () => MediaStats
}

export interface RatioConfig {
  videoRatio: number
  topVideoCount: number
  shuffleMode: 'random' | 'ratio-based' | 'featured'
}

export interface MediaStats {
  total: number
  images: number
  videos: number
  totalSize: number
  averageSize: number
  categories: Record<string, number>
}

// 🔍 검색 및 필터링 타입
export type SortBy = 'createdAt' | 'fileName' | 'type' | 'size'
export type SortOrder = 'asc' | 'desc'

export interface SearchFilters {
  query?: string
  type?: 'image' | 'video' | 'all'
  category?: string
  dateFrom?: Date
  dateTo?: Date
  sizeMin?: number
  sizeMax?: number
}

export interface SearchResult {
  media: GalleryMediaData[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 🌐 환경 관련 타입
export interface EnvironmentInfo {
  isProduction: boolean
  hasSupabaseConfig: boolean
  shouldUseSupabase: boolean
  hostname: string
  nodeEnv: string | undefined
  vercelEnv: string | undefined
  supabaseUrl: string | undefined
}

export type StorageType = 'indexeddb' | 'supabase' | 'vercel-blob'

export interface StorageConfig {
  type: StorageType
  description: string
  features: string[]
  maxSize?: number
  supportedFormats: string[]
}

// 🎨 UI 관련 타입
export interface MasonryGalleryProps {
  models: Media[]
  loading?: boolean
  columns?: number
  gutter?: string
  className?: string
  onMediaClick?: (media: Media) => void
  onMediaLoad?: (media: Media) => void
}

export interface ModelCardProps {
  id: string
  name: string
  imageUrl: string
  originalUrl?: string
  imageAlt: string
  category: string
  width: number
  height: number
  type?: 'image' | 'video'
  duration?: number
  resolution?: string
  isAdminMode?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: () => void
}

export interface HeaderProps {
  title?: string
  showNavigation?: boolean
  className?: string
}

export interface DebugPanelProps {
  show?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  environmentInfo?: EnvironmentInfo
  storageStats?: MediaStats
}

// 📱 반응형 타입
export interface ResponsiveBreakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  columns: number
}

export interface ViewportInfo {
  width: number
  height: number
  breakpoint: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

// 🔄 API 관련 타입
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode?: number
}

export interface UploadResponse {
  id: string
  url: string
  originalUrl?: string
  fileName: string
  type: 'image' | 'video'
  size: number
  metadata?: MediaMetadata
}

export interface DeleteResponse {
  id: string
  success: boolean
  message?: string
}

export interface StorageInfo {
  used: number
  available: number
  total: number
  percentage: number
}

// 🎭 이벤트 타입
export interface MediaEvent {
  type: 'upload' | 'delete' | 'update' | 'view'
  mediaId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ErrorEvent {
  type: 'upload_error' | 'delete_error' | 'load_error' | 'network_error'
  message: string
  error?: Error
  context?: Record<string, unknown>
  timestamp: Date
}

// 🔧 유틸리티 타입
export interface FileInfo {
  name: string
  size: number
  type: string
  extension: string
  mimeType: string
  isValid: boolean
  validationErrors?: string[]
}

export interface ImageProcessingOptions {
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  maxWidth?: number
  maxHeight?: number
  progressive?: boolean
}

export interface VideoProcessingOptions {
  quality?: number
  format?: 'mp4' | 'webm'
  maxWidth?: number
  maxHeight?: number
  generateThumbnail?: boolean
  thumbnailTime?: number
}

// 📊 성능 모니터링 타입
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  imageLoadTime: number
  apiResponseTime: number
  memoryUsage?: number
  cacheHitRate?: number
}

export interface LoadingState {
  isLoading: boolean
  progress?: number
  stage?: string
  error?: string
}

// 🔐 보안 관련 타입
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
  checkContent?: boolean
  scanForMalware?: boolean
}

// 📋 Prisma 타입 확장
export type Category = 'ASIAN' | 'EUROPEAN' | 'AFRICAN_AMERICAN' | 'HISPANIC' | 'SPECIAL'
export type FileType = 'IMAGE' | 'VIDEO'
export type ModelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

// 🎯 인덱스드DB 타입 (로컬 스토어용)
export interface IDBConfig {
  dbName: string
  version: number
  stores: IDBStoreConfig[]
}

export interface IDBStoreConfig {
  name: string
  keyPath: string
  autoIncrement?: boolean
  indices?: IDBIndexConfig[]
}

export interface IDBIndexConfig {
  name: string
  keyPath: string | string[]
  options?: IDBIndexParameters
}

// 🌟 고급 타입 유틸리티
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonEmptyArray<T> = [T, ...T[]]

// 🔄 상태 관리 타입
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch?: Date
}

export type AsyncAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

// 📅 시간 관련 타입
export interface TimeRange {
  start: Date
  end: Date
}

export interface DateFilter {
  period: 'today' | 'week' | 'month' | 'year' | 'custom'
  range?: TimeRange
}

// 🔍 고급 검색 타입
export interface AdvancedSearchOptions extends SearchFilters {
  sortBy?: SortBy
  sortOrder?: SortOrder
  limit?: number
  offset?: number
  includeMetadata?: boolean
  includeStats?: boolean
}

// 📈 분석 타입
export interface AnalyticsData {
  views: number
  downloads: number
  uploads: number
  storage: StorageInfo
  performance: PerformanceMetrics
  trends: TrendData[]
}

export interface TrendData {
  date: Date
  value: number
  type: 'views' | 'uploads' | 'downloads'
}

// 🎮 상호작용 타입
export interface InteractionEvent {
  type: 'click' | 'hover' | 'scroll' | 'resize'
  target: string
  timestamp: Date
  data?: Record<string, unknown>
}

export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
}

// 🎨 테마 타입
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    muted: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
  spacing: Record<string, string>
  breakpoints: Record<string, number>
}

// 🔧 설정 타입
export interface AppConfig {
  theme: Theme
  performance: typeof import('../lib/constants').PERFORMANCE_CONFIG
  security: typeof import('../lib/constants').SECURITY_CONFIG
  ui: typeof import('../lib/constants').UI_CONFIG
  api: typeof import('../lib/constants').API_CONFIG
}

// 📱 PWA 타입
export interface PWAConfig {
  enabled: boolean
  cacheName: string
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
  offlinePages: string[]
  backgroundSync: boolean
  pushNotifications: boolean
}

// 🌐 국제화 타입
export interface I18nConfig {
  defaultLocale: string
  locales: string[]
  namespaces: string[]
  fallback: Record<string, string>
}

export interface LocalizedContent {
  ko: string
  en?: string
  ja?: string
  zh?: string
}

// 📊 로그 타입
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  stack?: string
}

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void
}

// 🎯 최종 타입 익스포트 그룹
export type {
  // 기본 인터페이스들을 다시 익스포트하여 접근성 향상
  Media as MediaType,
  GalleryMediaData as GalleryMedia,
  MediaStore as Store,
  EnvironmentInfo as Environment,
  APIResponse as Response
}