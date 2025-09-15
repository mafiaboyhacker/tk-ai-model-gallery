/**
 * 로컬에서 Supabase 연결 테스트
 * 프로덕션 환경변수를 사용하여 연결 상태 확인
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...')
  console.log('📍 환경:', process.env.NODE_ENV || 'development')

  try {
    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('\n📋 1단계: 환경변수 검증')
    console.log('- URL:', supabaseUrl ? '✅ 설정됨' : '❌ 누락')
    console.log('- Anon Key:', supabaseAnonKey ? '✅ 설정됨' : '❌ 누락')
    console.log('- Service Key:', supabaseServiceKey ? '✅ 설정됨' : '❌ 누락')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('필수 환경변수가 누락되었습니다.')
    }

    // 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 2. 클라이언트 연결 테스트
    console.log('\n🔌 2단계: 클라이언트 연결 테스트')
    try {
      const { data: clientTest, error: clientError } = await supabase
        .from('test')
        .select('*')
        .limit(1)

      if (clientError) {
        console.log('- 클라이언트 테스트:', '⚠️', clientError.message)
      } else {
        console.log('- 클라이언트 테스트:', '✅ 연결 성공')
      }
    } catch (error) {
      console.log('- 클라이언트 테스트:', '❌', error.message)
    }

    // 3. 어드민 연결 테스트
    console.log('\n🔧 3단계: 어드민 연결 테스트')
    try {
      const { data: adminTest, error: adminError } = await supabaseAdmin
        .from('test')
        .select('*')
        .limit(1)

      if (adminError) {
        console.log('- 어드민 테스트:', '⚠️', adminError.message)
      } else {
        console.log('- 어드민 테스트:', '✅ 연결 성공')
      }
    } catch (error) {
      console.log('- 어드민 테스트:', '❌', error.message)
    }

    // 4. Storage 버킷 확인
    console.log('\n📦 4단계: Storage 버킷 확인')
    try {
      const { data: buckets, error: bucketError } = await supabaseAdmin
        .storage
        .listBuckets()

      if (bucketError) {
        console.log('- Storage 테스트:', '⚠️', bucketError.message)
      } else {
        console.log('- Storage 테스트:', '✅ 연결 성공')
        console.log('- 버킷 목록:', buckets?.map(b => b.name).join(', ') || '없음')
      }
    } catch (error) {
      console.log('- Storage 테스트:', '❌', error.message)
    }

    // 5. 데이터베이스 상태 확인
    console.log('\n🗄️ 5단계: 데이터베이스 상태 확인')
    try {
      const { data: dbTest } = await supabaseAdmin
        .rpc('version')
        .single()

      if (dbTest) {
        console.log('- 데이터베이스 테스트:', '✅ 연결 성공')
        console.log('- PostgreSQL 버전:', dbTest)
      } else {
        console.log('- 데이터베이스 테스트:', '⚠️ 버전 정보 없음')
      }
    } catch (error) {
      console.log('- 데이터베이스 테스트:', '❌', error.message)
    }

    console.log('\n✅ Supabase 연결 테스트 완료!')

  } catch (error) {
    console.error('\n❌ Supabase 연결 테스트 실패:', error.message)
    process.exit(1)
  }
}

// 테스트 실행
testSupabaseConnection()