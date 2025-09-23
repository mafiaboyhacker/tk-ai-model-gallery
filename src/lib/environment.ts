/**
 * 환경 감지 및 스토어 선택 유틸리티
 * 로컬: IndexedDB, Railway 배포: PostgreSQL + Volume 자동 전환
 */

// 🔒 Type definitions for environment configuration
export interface EnvironmentInfo {
  isProduction: boolean | undefined
  hasRailwayConfig: boolean
  shouldUseRailway: boolean
  hostname: string
  nodeEnv: string | undefined
  railwayEnv: string | undefined
  databaseUrl: string | undefined
}

export type StorageType = 'indexeddb' | 'railway'

export interface StorageConfig {
  type: StorageType
  description: string
  features: string[]
}

// 🚀 성능 최적화: 환경 감지 결과 캐싱
let cachedEnvironmentInfo: EnvironmentInfo | null = null
let environmentCacheTimestamp = 0
const CACHE_DURATION = 60000 // 1분 캐시

// 배포 환경 감지 (Railway 플랫폼 중심)
export const isProduction = (): boolean => {
  if (typeof window === 'undefined') {
    // 서버 사이드
    return !!(process.env.NODE_ENV === 'production' ||
           process.env.RAILWAY_ENVIRONMENT ||  // Railway 환경 감지
           process.env.NEXT_PUBLIC_APP_URL?.includes('railway.app'))
  } else {
    // 클라이언트 사이드
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('localhost')
  }
}

// Railway 연결 가능 여부 확인
export const hasRailwayConfig = () => {
  // 클라이언트 사이드에서는 URL 기반 감지
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('railway.app') ||
           window.location.hostname.includes('railway.internal')
  }

  // 서버 사이드에서는 환경변수 확인
  return !!(
    process.env.DATABASE_URL &&
    (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) &&
    (process.env.DATABASE_URL.includes('railway.internal') ||
     process.env.DATABASE_URL.includes('postgres.railway') ||
     process.env.DATABASE_URL.includes('postgres:') && process.env.RAILWAY_ENVIRONMENT)
  )
}

// 환경별 스토어 선택 로직
export const shouldUseRailway = () => {
  // 🧪 임시 테스트: URL 파라미터로 강제 Railway 사용 가능
  if (typeof window !== 'undefined' && window.location.search.includes('force-railway')) {
    console.log('🧪 강제 Railway 모드: URL 파라미터 감지')
    return hasRailwayConfig()
  }

  // Railway 도메인에서는 강제로 Railway 사용
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    console.log('🚀 Railway 도메인 감지: 강제 Railway 사용')
    return true
  }

  // 로컬 개발 환경에서는 무조건 IndexedDB 사용
  if (!isProduction()) {
    console.log('🏠 로컬 환경 감지: IndexedDB 사용')
    return false
  }

  // 배포 환경에서는 Railway 설정 확인 후 사용
  if (hasRailwayConfig()) {
    console.log('🚀 Railway 배포 환경 감지: PostgreSQL + Volume 사용')
    return true
  } else {
    console.warn('⚠️ 배포 환경이지만 Railway 설정 없음: IndexedDB 폴백')
    return false
  }
}

// 🚀 성능 최적화: 캐시된 환경 정보 반환 (디버깅용)
export const getEnvironmentInfo = (): EnvironmentInfo => {
  const now = Date.now()

  // 캐시 유효성 확인
  if (cachedEnvironmentInfo && (now - environmentCacheTimestamp) < CACHE_DURATION) {
    return cachedEnvironmentInfo
  }

  // 새로운 환경 정보 계산
  const envInfo: EnvironmentInfo = {
    isProduction: isProduction(),
    hasRailwayConfig: hasRailwayConfig(),
    shouldUseRailway: shouldUseRailway(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    nodeEnv: process.env.NODE_ENV,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT,
    databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...' // 보안을 위해 일부만 표시
  }

  // 캐시 업데이트
  cachedEnvironmentInfo = envInfo
  environmentCacheTimestamp = now

  return envInfo
}

// 🔄 하위 호환성을 위한 Supabase → Railway 마이그레이션 alias
export const shouldUseSupabase = shouldUseRailway
export const hasSupabaseConfig = hasRailwayConfig