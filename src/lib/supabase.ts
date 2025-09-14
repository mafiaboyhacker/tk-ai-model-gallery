/**
 * Supabase 클라이언트 설정
 * Storage API와 Database API 통합
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정 (새 프로젝트 정보)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hjovusgefakpcwghoixk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_ROQAqeNFDTssrjZzV2zshg_FA2fXApm'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb3Z1c2dlZmFrcGN3Z2hvaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjEyODIsImV4cCI6MjA3MzM5NzI4Mn0.xTKEV7f3ac3dQU_pD48Sefy6QYQWU7bg1Ci-Q7Z-kvk'

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