/**
 * Supabase Storage 버킷 설정 스크립트
 * 미디어 파일용 버킷 생성 및 정책 구성
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function setupSupabaseStorage() {
  console.log('🚀 Supabase Storage 설정 시작...')

  try {
    // Supabase Admin 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('필수 환경변수가 누락되었습니다. (URL, SERVICE_KEY)')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Supabase Admin 클라이언트 생성 완료')

    // 1. 기존 버킷 확인
    console.log('\n📦 1단계: 기존 버킷 확인...')
    const { data: existingBuckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (listError) {
      throw new Error(`버킷 목록 조회 실패: ${listError.message}`)
    }

    console.log('기존 버킷:', existingBuckets?.map(b => b.name).join(', ') || '없음')

    // 2. 이미지 버킷 생성
    console.log('\n🖼️ 2단계: 이미지 버킷 생성...')
    const imagesBucketExists = existingBuckets?.some(b => b.name === 'images')

    if (!imagesBucketExists) {
      const { data: imagesData, error: imagesError } = await supabaseAdmin
        .storage
        .createBucket('images', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
          ],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        })

      if (imagesError) {
        console.log('❌ 이미지 버킷 생성 실패:', imagesError.message)
      } else {
        console.log('✅ 이미지 버킷 생성 성공:', imagesData)
      }
    } else {
      console.log('ℹ️ 이미지 버킷이 이미 존재합니다.')
    }

    // 3. 비디오 버킷 생성
    console.log('\n🎥 3단계: 비디오 버킷 생성...')
    const videosBucketExists = existingBuckets?.some(b => b.name === 'videos')

    if (!videosBucketExists) {
      const { data: videosData, error: videosError } = await supabaseAdmin
        .storage
        .createBucket('videos', {
          public: true,
          allowedMimeTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime'
          ],
          fileSizeLimit: 500 * 1024 * 1024 // 500MB
        })

      if (videosError) {
        console.log('❌ 비디오 버킷 생성 실패:', videosError.message)
      } else {
        console.log('✅ 비디오 버킷 생성 성공:', videosData)
      }
    } else {
      console.log('ℹ️ 비디오 버킷이 이미 존재합니다.')
    }

    // 4. 썸네일 버킷 생성 (비디오 썸네일용)
    console.log('\n🖼️ 4단계: 썸네일 버킷 생성...')
    const thumbnailsBucketExists = existingBuckets?.some(b => b.name === 'thumbnails')

    if (!thumbnailsBucketExists) {
      const { data: thumbnailsData, error: thumbnailsError } = await supabaseAdmin
        .storage
        .createBucket('thumbnails', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
          ],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB
        })

      if (thumbnailsError) {
        console.log('❌ 썸네일 버킷 생성 실패:', thumbnailsError.message)
      } else {
        console.log('✅ 썸네일 버킷 생성 성공:', thumbnailsData)
      }
    } else {
      console.log('ℹ️ 썸네일 버킷이 이미 존재합니다.')
    }

    // 5. 최종 버킷 목록 확인
    console.log('\n📋 5단계: 최종 버킷 목록 확인...')
    const { data: finalBuckets, error: finalListError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (finalListError) {
      throw new Error(`최종 버킷 목록 조회 실패: ${finalListError.message}`)
    }

    console.log('📦 생성된 버킷 목록:')
    finalBuckets?.forEach(bucket => {
      console.log(`  - ${bucket.name}: ${bucket.public ? '공개' : '비공개'}`)
    })

    // 6. 버킷별 설정 정보 출력
    console.log('\n🔧 6단계: 버킷 설정 정보:')
    console.log('Images 버킷:')
    console.log('  - 용도: AI 생성 이미지 저장')
    console.log('  - 형식: JPEG, PNG, WebP')
    console.log('  - 크기 제한: 50MB')
    console.log('  - 접근: 공개')

    console.log('\nVideos 버킷:')
    console.log('  - 용도: AI 생성 비디오 저장')
    console.log('  - 형식: MP4, WebM, QuickTime')
    console.log('  - 크기 제한: 500MB')
    console.log('  - 접근: 공개')

    console.log('\nThumbnails 버킷:')
    console.log('  - 용도: 비디오 썸네일 이미지')
    console.log('  - 형식: JPEG, PNG, WebP')
    console.log('  - 크기 제한: 10MB')
    console.log('  - 접근: 공개')

    console.log('\n✅ Supabase Storage 설정 완료!')

  } catch (error) {
    console.error('\n❌ Storage 설정 실패:', error.message)
    process.exit(1)
  }
}

// 설정 실행
setupSupabaseStorage()