/**
 * 단순 Supabase 연결 테스트
 * 기본 연결만 확인
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function simpleTest() {
  console.log('🔍 단순 Supabase 연결 테스트...')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('URL:', supabaseUrl)
    console.log('Project:', supabaseUrl?.split('.')[0]?.split('//')[1])

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 가장 기본적인 테스트 - 인증 정보 확인
    console.log('\n📋 인증 정보 확인...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('인증 상태:', authError ? '❌ ' + authError.message : '✅ 연결 가능')

    // Storage 헬스체크
    console.log('\n📦 Storage 기본 확인...')
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      console.log('Storage 상태:', error ? '❌ ' + error.message : '✅ 접근 가능')
      console.log('버킷 수:', buckets?.length || 0)
    } catch (e) {
      console.log('Storage 상태:', '❌', e.message)
    }

    // 프로젝트 정보 확인
    console.log('\n🏗️ 프로젝트 정보...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('프로젝트 ID:', supabaseUrl?.split('.')[0]?.split('//')[1])
    console.log('리전:', 'ap-northeast-2 (서울)')

    console.log('\n✅ 기본 연결 테스트 완료!')

  } catch (error) {
    console.error('❌ 연결 실패:', error.message)
  }
}

simpleTest()