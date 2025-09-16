/**
 * Supabase 클라이언트 설정
 * Storage API와 Database API 통합
 * 환경별 조건부 로딩
 */

import { createClient } from '@supabase/supabase-js'
import { shouldUseSupabase, hasSupabaseConfig } from './environment'

// 환경 감지
const useSupabase = shouldUseSupabase()
const isServer = typeof window === 'undefined'

// 환경별 로깅
if (useSupabase) {
  console.log('🚀 Supabase 모드: 클라이언트 초기화 진행')
} else {
  console.log('🏠 로컬 개발 모드: Supabase 클라이언트 비활성화')
}

// Supabase 프로젝트 설정 (Supabase 사용시에만 가져오기)
const supabaseUrl = useSupabase ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '') : ''
const supabaseAnonKey = useSupabase ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') : ''
const supabaseServiceKey = useSupabase && isServer ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '') : ''

// Supabase 사용시에만 환경 변수 디버깅 로그
if (useSupabase) {
  console.log('🔍 Supabase 환경 변수 디버깅:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    nodeEnv: process.env.NODE_ENV,
    isServer,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })

  // 환경변수 유효성 검사
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase 환경변수가 누락되었습니다:', {
      url: !!supabaseUrl,
      anonKey: !!supabaseAnonKey,
      environment: typeof window !== 'undefined' ? 'client' : 'server'
    })
  }
}

// 클라이언트 사이드용 (Public 작업) - 조건부 초기화
export const supabase = useSupabase && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      if (useSupabase) {
        console.error('❌ Supabase 클라이언트 생성 실패: 환경 변수 누락', { url: !!supabaseUrl, anonKey: !!supabaseAnonKey })
        return createClient('https://dummy-failed.supabase.co', 'dummy-key') // 실패 표시용 더미
      } else {
        // 로컬 환경에서는 더미 클라이언트 반환 (에러 없이)
        return createClient('https://local-dev.supabase.co', 'local-dev-key')
      }
    })()

// 서버 사이드용 (Admin 작업 - 파일 업로드/삭제) - 조건부 초기화
export const supabaseAdmin = useSupabase && supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (() => {
      if (useSupabase) {
        console.error('❌ Supabase Admin 클라이언트 생성 실패: 환경 변수 누락', { url: !!supabaseUrl, serviceKey: !!supabaseServiceKey })
        return createClient('https://dummy-admin-failed.supabase.co', 'dummy-key') // 실패 표시용 더미
      } else {
        // 로컬 환경에서는 더미 클라이언트 반환 (에러 없이)
        return createClient('https://local-dev-admin.supabase.co', 'local-dev-admin-key')
      }
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