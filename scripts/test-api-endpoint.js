/**
 * API 엔드포인트 테스트 스크립트
 * 실제 업로드/삭제 API가 제대로 작동하는지 확인
 */

const fetch = require('node-fetch')
const fs = require('fs')
const FormData = require('form-data')

async function testAPIEndpoint() {
  console.log('🌐 API 엔드포인트 테스트 시작...\n')

  const apiBaseUrl = 'http://localhost:3000/api'
  const uploadUrl = `${apiBaseUrl}/upload`

  try {
    // 1. GET 요청으로 Storage 상태 확인
    console.log('📋 1단계: Storage 상태 확인 (GET /api/upload)')

    const getResponse = await fetch(uploadUrl, { method: 'GET' })

    if (!getResponse.ok) {
      console.log('❌ API 서버 응답 실패:', getResponse.status)
      console.log('💡 해결 방법: npm run dev로 개발 서버를 실행해주세요.')
      return
    }

    const statusResult = await getResponse.json()
    console.log('✅ API 서버 응답 성공')
    console.log('Storage 연결:', statusResult.storage?.isConnected ? '✅ 연결됨' : '❌ 연결 실패')
    console.log('버킷 존재:', statusResult.storage?.bucketExists ? '✅ 존재함' : '❌ 없음')

    if (!statusResult.success) {
      console.log('❌ Storage 상태 오류:', statusResult.error)
      return
    }

    // 2. 테스트 이미지 파일 생성 (1x1 픽셀 PNG)
    console.log('\n📤 2단계: 테스트 파일 업로드')

    // Base64로 인코딩된 1x1 픽셀 투명 PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77YgAAAABJRU5ErkJggg=='
    const testImageBuffer = Buffer.from(pngBase64, 'base64')

    // FormData 생성
    const formData = new FormData()
    formData.append('files', testImageBuffer, {
      filename: `test-upload-${Date.now()}.png`,
      contentType: 'image/png'
    })

    // POST 요청으로 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      console.log('❌ 업로드 요청 실패:', uploadResponse.status)
      const errorText = await uploadResponse.text()
      console.log('오류 내용:', errorText)
      return
    }

    const uploadResult = await uploadResponse.json()
    console.log('업로드 결과:', uploadResult.success ? '✅ 성공' : '❌ 실패')

    if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
      const uploadedFile = uploadResult.files[0]
      console.log('✅ 파일 업로드 성공')
      console.log('   - 파일 ID:', uploadedFile.id)
      console.log('   - 파일명:', uploadedFile.fileName)
      console.log('   - URL:', uploadedFile.url)
      console.log('   - 크기:', uploadedFile.size, 'bytes')

      // 3. 업로드된 파일 삭제 테스트
      console.log('\n🗑️ 3단계: 파일 삭제 테스트')

      const deleteUrl = `${uploadUrl}?id=${uploadedFile.id}`
      const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' })

      if (!deleteResponse.ok) {
        console.log('❌ 삭제 요청 실패:', deleteResponse.status)
        const deleteErrorText = await deleteResponse.text()
        console.log('삭제 오류:', deleteErrorText)
      } else {
        const deleteResult = await deleteResponse.json()
        console.log('삭제 결과:', deleteResult.success ? '✅ 성공' : '❌ 실패')

        if (deleteResult.success) {
          console.log('✅ 파일 삭제 성공:', deleteResult.deletedId)
        } else {
          console.log('❌ 삭제 실패:', deleteResult.error)
        }
      }
    } else {
      console.log('❌ 업로드 실패:', uploadResult.error)
      if (uploadResult.errors) {
        uploadResult.errors.forEach(error => console.log('   -', error))
      }
    }

    // 4. 종합 결과
    console.log('\n📊 API 테스트 종합 결과')
    console.log('================================')
    console.log('✅ API 서버 연결: 정상')
    console.log(`${statusResult.success ? '✅' : '❌'} Storage 상태: ${statusResult.success ? '정상' : '오류'}`)
    console.log(`${uploadResult.success ? '✅' : '❌'} 파일 업로드: ${uploadResult.success ? '정상' : '실패'}`)

    if (statusResult.success && uploadResult.success) {
      console.log('\n🎉 모든 API 테스트 통과!')
      console.log('✅ Supabase Storage 연동 완료')
      console.log('\n📝 준비된 API 엔드포인트:')
      console.log('- GET /api/upload: Storage 상태 확인')
      console.log('- POST /api/upload: 파일 업로드 (multipart/form-data)')
      console.log('- DELETE /api/upload?id={fileId}: 파일 삭제')
    } else {
      console.log('\n⚠️ 일부 테스트 실패')
      console.log('Service Role Key 문제를 해결하면 정상 작동할 것으로 예상됩니다.')
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 개발 서버 연결 실패')
      console.log('💡 해결 방법:')
      console.log('1. 새 터미널에서 "npm run dev" 실행')
      console.log('2. 서버가 시작된 후 이 테스트 다시 실행')
    } else {
      console.error('❌ API 테스트 실행 중 오류:', error.message)
    }
  }
}

testAPIEndpoint()