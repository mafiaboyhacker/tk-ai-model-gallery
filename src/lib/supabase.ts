/**
 * Supabase 클라이언트 설정
 * Storage API와 Database API 통합
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정 (환경변수에서 가져오기)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경변수 유효성 검사
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 누락되었습니다:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey
  })
}

// 클라이언트 사이드용 (Public 작업)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드용 (Admin 작업 - 파일 업로드/삭제)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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