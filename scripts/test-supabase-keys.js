/**
 * Supabase 키 테스트 스크립트
 * 각 키의 권한과 기능을 확인
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function testSupabaseKeys() {
  console.log('🔑 Supabase 키 테스트 시작...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('\n📋 환경변수 상태:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key 길이:', supabaseAnonKey?.length || 0)
  console.log('Service Key 길이:', supabaseServiceKey?.length || 0)

  // 1. Anon Key 테스트
  console.log('\n🔓 1단계: Anon Key 테스트')
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // 기본 연결 테스트
    const { data: authData, error: authError } = await anonClient.auth.getSession()
    console.log('Anon Key 인증:', authError ? '❌ ' + authError.message : '✅ 정상')

    // Storage 읽기 테스트
    const { data: bucketsAnon, error: anonStorageError } = await anonClient
      .storage
      .listBuckets()

    console.log('Anon Key Storage 읽기:', anonStorageError ? '❌ ' + anonStorageError.message : `✅ 정상 (버킷 ${bucketsAnon?.length || 0}개)`)

  } catch (error) {
    console.log('Anon Key 테스트 실패:', error.message)
  }

  // 2. Service Key 테스트
  console.log('\n🔧 2단계: Service Key 테스트')
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Storage 관리 테스트
    const { data: bucketsService, error: serviceStorageError } = await serviceClient
      .storage
      .listBuckets()

    console.log('Service Key Storage 관리:', serviceStorageError ? '❌ ' + serviceStorageError.message : `✅ 정상 (버킷 ${bucketsService?.length || 0}개)`)

    // 데이터베이스 관리 테스트
    try {
      const { data: dbVersion } = await serviceClient
        .rpc('version')
        .single()

      console.log('Service Key DB 접근:', dbVersion ? `✅ 정상 (${dbVersion})` : '⚠️ 제한적')
    } catch (dbError) {
      console.log('Service Key DB 접근:', '⚠️ ' + dbError.message)
    }

  } catch (error) {
    console.log('Service Key 테스트 실패:', error.message)
  }

  // 3. 키 포맷 검증
  console.log('\n🔍 3단계: 키 포맷 검증')

  // JWT 토큰 형태인지 확인
  const isValidJWT = (token) => {
    if (!token) return false
    const parts = token.split('.')
    return parts.length === 3
  }

  console.log('Anon Key JWT 형태:', isValidJWT(supabaseAnonKey) ? '✅ 올바름' : '❌ 잘못됨')
  console.log('Service Key JWT 형태:', isValidJWT(supabaseServiceKey) ? '✅ 올바름' : '❌ 잘못됨')

  // 4. 권장사항
  console.log('\n💡 4단계: 권장사항')
  console.log('1. Supabase Dashboard > Settings > API에서 키 확인')
  console.log('2. Project API URL이 정확한지 확인')
  console.log('3. Service Role Key는 "service_role" 권한이어야 함')
  console.log('4. 모든 키는 JWT 형태여야 함 (3개 부분으로 구성)')

  console.log('\n✅ 키 테스트 완료!')
}

testSupabaseKeys()