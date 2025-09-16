/**
 * 환경 감지 및 스토어 선택 유틸리티
 * 로컬: IndexedDB, 배포: Supabase 자동 전환
 */

// 🔒 Type definitions for environment configuration
export interface EnvironmentInfo {
  isProduction: boolean | undefined
  hasSupabaseConfig: boolean
  shouldUseSupabase: boolean
  hostname: string
  nodeEnv: string | undefined
  vercelEnv: string | undefined
  supabaseUrl: string | undefined
}

export type StorageType = 'indexeddb' | 'supabase'

export interface StorageConfig {
  type: StorageType
  description: string
  features: string[]
}

// 배포 환경 감지
export const isProduction = () => {
  if (typeof window === 'undefined') {
    // 서버 사이드
    return process.env.NODE_ENV === 'production' ||
           process.env.VERCEL_ENV === 'production' ||
           process.env.NEXT_PUBLIC_APP_URL?.includes('vercel.app')
  } else {
    // 클라이언트 사이드
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('localhost')
  }
}

// Supabase 연결 가능 여부 확인
export const hasSupabaseConfig = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://example.supabase.co'
  )
}

// 환경별 스토어 선택 로직
export const shouldUseSupabase = () => {
  // 🧪 임시 테스트: URL 파라미터로 강제 Supabase 사용 가능
  if (typeof window !== 'undefined' && window.location.search.includes('force-supabase')) {
    console.log('🧪 강제 Supabase 모드: URL 파라미터 감지')
    return hasSupabaseConfig()
  }

  // 로컬 개발 환경에서는 무조건 IndexedDB 사용
  if (!isProduction()) {
    console.log('🏠 로컬 환경 감지: IndexedDB 사용')
    return false
  }

  // 배포 환경에서는 Supabase 설정 확인 후 사용
  if (hasSupabaseConfig()) {
    console.log('🚀 배포 환경 감지: Supabase 사용')
    return true
  } else {
    console.warn('⚠️ 배포 환경이지만 Supabase 설정 없음: IndexedDB 폴백')
    return false
  }
}

// 환경 정보 출력 (디버깅용)
export const getEnvironmentInfo = () => {
  return {
    isProduction: isProduction(),
    hasSupabaseConfig: hasSupabaseConfig(),
    shouldUseSupabase: shouldUseSupabase(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  }
}