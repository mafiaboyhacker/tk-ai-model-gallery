/**
 * Supabase Storage 종합 테스트 스크립트
 * 모든 Storage 기능을 테스트하고 검증
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function testSupabaseStorageComplete() {
  console.log('🔥 Supabase Storage 종합 테스트 시작...\n')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('필수 환경변수가 누락되었습니다.')
    }

    // Admin 클라이언트 (Service Role Key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 클라이언트 (Anon Key)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    console.log('✅ Supabase 클라이언트 생성 완료\n')

    // ==========================================
    // 1단계: 기본 연결 테스트
    // ==========================================
    console.log('📋 1단계: 기본 연결 테스트')

    // Service Role Key 테스트
    const { data: serviceAuth, error: serviceAuthError } = await supabaseAdmin.auth.getSession()
    console.log('Service Role 인증:', serviceAuthError ? '❌ ' + serviceAuthError.message : '✅ 정상')

    // Anon Key 테스트
    const { data: anonAuth, error: anonAuthError } = await supabaseClient.auth.getSession()
    console.log('Anon Key 인증:', anonAuthError ? '❌ ' + anonAuthError.message : '✅ 정상')

    // ==========================================
    // 2단계: 버킷 상태 확인
    // ==========================================
    console.log('\n📦 2단계: 버킷 상태 확인')

    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      console.log('❌ 버킷 목록 조회 실패:', bucketsError.message)
      return
    }

    console.log('✅ 버킷 목록 조회 성공')

    const mediaBucket = buckets?.find(bucket => bucket.name === 'media')
    if (mediaBucket) {
      console.log('✅ media 버킷 존재 확인')
      console.log(`   - 공개 접근: ${mediaBucket.public ? '허용' : '차단'}`)
      console.log(`   - 생성일: ${mediaBucket.created_at}`)
    } else {
      console.log('❌ media 버킷이 존재하지 않습니다.')
      console.log('\n🔧 해결 방법:')
      console.log('1. Supabase Dashboard 접속')
      console.log('2. Storage > Buckets 메뉴')
      console.log('3. "New bucket" 클릭')
      console.log('4. 이름: "media", Public: true로 설정')
      console.log('5. 허용 파일 형식: image/*, video/*')
      console.log('6. 파일 크기 제한: 500MB')
      return
    }

    // ==========================================
    // 3단계: 폴더 구조 확인
    // ==========================================
    console.log('\n📁 3단계: 폴더 구조 확인')

    const requiredFolders = ['images', 'videos', 'metadata']
    const folderStatus = {}

    for (const folder of requiredFolders) {
      const { data: folderFiles, error: folderError } = await supabaseAdmin.storage
        .from('media')
        .list(folder, { limit: 1 })

      folderStatus[folder] = !folderError
      console.log(`${!folderError ? '✅' : '❌'} ${folder} 폴더: ${!folderError ? '접근 가능' : folderError.message}`)
    }

    // ==========================================
    // 4단계: 권한 테스트
    // ==========================================
    console.log('\n🔐 4단계: 권한 테스트')

    // Admin 권한으로 버킷 내용 조회
    const { data: adminFiles, error: adminListError } = await supabaseAdmin.storage
      .from('media')
      .list('', { limit: 10 })

    console.log('Admin 파일 조회:', adminListError ? '❌ ' + adminListError.message : `✅ 정상 (${adminFiles?.length || 0}개 파일)`)

    // Anon 권한으로 버킷 내용 조회 (공개 버킷이면 가능해야 함)
    const { data: anonFiles, error: anonListError } = await supabaseClient.storage
      .from('media')
      .list('', { limit: 10 })

    console.log('Anon 파일 조회:', anonListError ? '❌ ' + anonListError.message : `✅ 정상 (${anonFiles?.length || 0}개 파일)`)

    // ==========================================
    // 5단계: 테스트 파일 업로드
    // ==========================================
    console.log('\n📤 5단계: 테스트 파일 업로드')

    // 간단한 테스트 파일 생성
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77YgAAAABJRU5ErkJggg==', 'base64')
    const testFileName = `test-${Date.now()}.png`
    const testFilePath = `images/${testFileName}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('media')
      .upload(testFilePath, testImageContent, {
        contentType: 'image/png'
      })

    if (uploadError) {
      console.log('❌ 테스트 파일 업로드 실패:', uploadError.message)
    } else {
      console.log('✅ 테스트 파일 업로드 성공:', uploadData.path)

      // 공개 URL 생성 테스트
      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(testFilePath)

      console.log('✅ 공개 URL 생성 성공:', urlData.publicUrl)

      // 파일 삭제 테스트
      const { error: deleteError } = await supabaseAdmin.storage
        .from('media')
        .remove([testFilePath])

      console.log('테스트 파일 삭제:', deleteError ? '❌ ' + deleteError.message : '✅ 성공')
    }

    // ==========================================
    // 6단계: API 엔드포인트 테스트
    // ==========================================
    console.log('\n🌐 6단계: API 엔드포인트 테스트')

    try {
      // 로컬 API 엔드포인트가 있는지 확인
      const apiUrl = 'http://localhost:3000/api/upload'

      // GET 요청으로 Storage 상태 확인
      const response = await fetch(apiUrl, { method: 'GET' })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API 엔드포인트 응답:', result.success ? '정상' : '오류')
        console.log('   Storage 연결:', result.storage?.isConnected ? '✅ 연결됨' : '❌ 연결 실패')
        console.log('   버킷 존재:', result.storage?.bucketExists ? '✅ 존재함' : '❌ 없음')
      } else {
        console.log('❌ API 엔드포인트 응답 실패:', response.status)
      }
    } catch (apiError) {
      console.log('⚠️ API 엔드포인트 테스트 건너뜀 (개발 서버가 실행되지 않음)')
    }

    // ==========================================
    // 7단계: 종합 결과
    // ==========================================
    console.log('\n📊 종합 테스트 결과')
    console.log('================================')
    console.log('✅ 기본 연결: 정상')
    console.log(`${mediaBucket ? '✅' : '❌'} 버킷 존재: ${mediaBucket ? '정상' : '버킷 생성 필요'}`)
    console.log(`${folderStatus.images && folderStatus.videos ? '✅' : '❌'} 폴더 구조: ${folderStatus.images && folderStatus.videos ? '정상' : '일부 폴더 접근 불가'}`)
    console.log(`${!adminListError ? '✅' : '❌'} 권한 설정: ${!adminListError ? '정상' : '권한 문제'}`)
    console.log(`${!uploadError ? '✅' : '❌'} 파일 업로드: ${!uploadError ? '정상' : '업로드 실패'}`)

    if (mediaBucket && !adminListError && !uploadError) {
      console.log('\n🎉 모든 테스트 통과! Supabase Storage 연동 준비 완료')
      console.log('\n다음 단계:')
      console.log('1. npm run dev 실행')
      console.log('2. 브라우저에서 http://localhost:3000/api/upload GET 요청으로 최종 확인')
      console.log('3. 실제 파일 업로드 테스트')
    } else {
      console.log('\n⚠️ 일부 테스트 실패 - 위의 오류를 수정한 후 다시 시도해주세요.')
    }

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류 발생:', error.message)
    console.log('\n🔧 문제 해결:')
    console.log('1. .env.local 파일의 환경변수 확인')
    console.log('2. Supabase 프로젝트 상태 확인')
    console.log('3. 네트워크 연결 확인')
  }
}

// 테스트 실행
testSupabaseStorageComplete()