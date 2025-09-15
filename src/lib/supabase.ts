/**
 * Supabase 클라이언트 설정
 * Storage API와 Database API 통합
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정 (환경변수에서 가져오기)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 서버 사이드에서만 SERVICE_ROLE_KEY 접근
const isServer = typeof window === 'undefined'
const supabaseServiceKey = isServer ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '') : ''

// 환경 변수 디버깅 로그
console.log('🔍 Supabase 환경 변수 디버깅:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  nodeEnv: process.env.NODE_ENV,
  isServer,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
})

// 환경변수 유효성 검사 (에러 대신 경고로 변경)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 환경변수가 누락되었습니다:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    environment: typeof window !== 'undefined' ? 'client' : 'server'
  })
}

// 클라이언트 사이드용 (Public 작업) - 안전한 초기화
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      console.error('❌ Supabase 클라이언트 생성 실패: 환경 변수 누락', { url: !!supabaseUrl, anonKey: !!supabaseAnonKey })
      return createClient('https://dummy-failed.supabase.co', 'dummy-key') // 실패 표시용 더미
    })()

// 서버 사이드용 (Admin 작업 - 파일 업로드/삭제)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (() => {
      console.error('❌ Supabase Admin 클라이언트 생성 실패: 환경 변수 누락', { url: !!supabaseUrl, serviceKey: !!supabaseServiceKey })
      return createClient('https://dummy-admin-failed.supabase.co', 'dummy-key') // 실패 표시용 더미
    })()

// 환경변수 검증
export function validateSupabaseConfig() {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
  }
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.')
  }
  if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 파일 업로드가 제한될 수 있습니다.')
  }

  console.log('✅ Supabase 설정 완료:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey
  })

  return true
}