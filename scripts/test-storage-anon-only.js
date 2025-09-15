/**
 * Anon Key만으로 Supabase Storage 테스트
 * Service Role Key 문제가 해결될 때까지 임시 테스트
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function testStorageWithAnonKey() {
  console.log('🔍 Anon Key로 Supabase Storage 테스트...\n')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('필수 환경변수 누락: SUPABASE_URL 또는 ANON_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('✅ Supabase 클라이언트 생성 완료')
    console.log('프로젝트 URL:', supabaseUrl)
    console.log('Anon Key 길이:', supabaseAnonKey.length)

    // 1. 기본 인증 테스트
    console.log('\n📋 1단계: 기본 인증 테스트')
    const { data: session, error: authError } = await supabase.auth.getSession()
    console.log('인증 상태:', authError ? '❌ ' + authError.message : '✅ 정상')

    // 2. 버킷 목록 조회 (Anon Key로 가능한지 확인)
    console.log('\n📦 2단계: 버킷 목록 조회 (Anon Key)')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.log('❌ Anon Key로 버킷 목록 조회 실패:', listError.message)
      console.log('   → 이는 정상적인 동작일 수 있습니다 (권한 제한)')
    } else {
      console.log('✅ Anon Key로 버킷 목록 조회 성공')
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name}: ${bucket.public ? '공개' : '비공개'}`)
        })
      } else {
        console.log('   📝 현재 생성된 버킷이 없습니다.')
      }
    }

    // 3. media 버킷 내용 조회 시도
    console.log('\n📁 3단계: media 버킷 내용 조회')
    const { data: files, error: filesError } = await supabase.storage
      .from('media')
      .list('', { limit: 5 })

    if (filesError) {
      console.log('❌ media 버킷 조회 실패:', filesError.message)

      if (filesError.message.includes('not found') || filesError.message.includes('does not exist')) {
        console.log('\n🔧 해결 방법: media 버킷이 존재하지 않습니다.')
        console.log('1. Supabase Dashboard > Storage > Buckets')
        console.log('2. "New bucket" 클릭')
        console.log('3. Name: "media", Public: true')
        console.log('4. File size limit: 500MB')
        console.log('5. Allowed MIME types: image/*, video/*')
      } else if (filesError.message.includes('permission') || filesError.message.includes('not allowed')) {
        console.log('\n🔧 해결 방법: 권한 설정이 필요합니다.')
        console.log('1. Supabase Dashboard > Storage > Policies')
        console.log('2. "New policy" 클릭')
        console.log('3. SELECT 권한을 public (anon) 사용자에게 허용')
      }
    } else {
      console.log('✅ media 버킷 조회 성공')
      console.log(`   파일 수: ${files?.length || 0}개`)

      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`)
        })
      }
    }

    // 4. 개별 폴더 확인
    console.log('\n📂 4단계: 폴더별 내용 확인')
    const folders = ['images', 'videos', 'metadata']

    for (const folder of folders) {
      const { data: folderFiles, error: folderError } = await supabase.storage
        .from('media')
        .list(folder, { limit: 3 })

      if (folderError) {
        console.log(`❌ ${folder} 폴더 조회 실패: ${folderError.message}`)
      } else {
        console.log(`✅ ${folder} 폴더: ${folderFiles?.length || 0}개 파일`)
      }
    }

    // 5. 공개 URL 테스트 (더미 경로)
    console.log('\n🔗 5단계: 공개 URL 생성 테스트')
    try {
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl('images/test.jpg')

      console.log('✅ 공개 URL 생성 성공')
      console.log('   URL 패턴:', urlData.publicUrl)
      console.log('   Base URL:', urlData.publicUrl.split('/storage/')[0] + '/storage/v1/object/public/')
    } catch (urlError) {
      console.log('❌ 공개 URL 생성 실패:', urlError.message)
    }

    // 6. 환경 정보 요약
    console.log('\n📊 환경 정보 요약')
    console.log('================================')
    console.log('Supabase URL:', supabaseUrl)
    console.log('프로젝트 ID:', supabaseUrl?.split('.')[0]?.replace('https://', ''))
    console.log('Anon Key 유효성:', supabaseAnonKey.split('.').length === 3 ? '✅ JWT 형식' : '❌ 잘못된 형식')
    console.log('버킷 접근:', !listError ? '✅ 가능' : '❌ 제한됨')
    console.log('파일 조회:', !filesError ? '✅ 가능' : '❌ 불가능')

    // 7. 다음 단계 안내
    console.log('\n🚀 다음 단계')
    console.log('================================')

    if (filesError) {
      console.log('📝 필요한 작업:')
      console.log('1. Supabase Dashboard에서 "media" 버킷 생성')
      console.log('2. 버킷을 Public으로 설정')
      console.log('3. Storage Policies에서 공개 읽기 권한 추가')
      console.log('4. Service Role Key 재생성 (현재 서명 검증 실패)')
    } else {
      console.log('✅ 기본 설정 완료!')
      console.log('1. Service Role Key 문제만 해결하면 모든 기능 사용 가능')
      console.log('2. 새로운 Service Role Key 생성 후 .env.local 업데이트')
    }

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류:', error.message)
  }
}

testStorageWithAnonKey()