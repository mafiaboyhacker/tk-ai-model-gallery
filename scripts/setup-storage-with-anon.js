/**
 * Anon Key로 가능한 Storage 작업 확인
 * 버킷 생성은 서비스 키가 필요하므로 우선 현재 상태 확인
 */

const { createClient } = require('@supabase/supabase-js')

// 환경변수 로드
require('dotenv').config({ path: '.env.local' })

async function checkStorageWithAnon() {
  console.log('🔍 Anon Key로 Storage 상태 확인...')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. 기존 버킷 확인
    console.log('\n📦 1단계: 기존 버킷 확인...')
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()

    if (listError) {
      console.log('❌ 버킷 목록 조회 실패:', listError.message)
    } else {
      console.log('✅ 버킷 목록 조회 성공')
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`  - ${bucket.name}: ${bucket.public ? '공개' : '비공개'} (생성일: ${bucket.created_at})`)
        })
      } else {
        console.log('  📝 현재 생성된 버킷이 없습니다.')
      }
    }

    // 2. Storage 정보 확인
    console.log('\n🏗️ 2단계: Supabase 프로젝트 정보')
    console.log('프로젝트 URL:', supabaseUrl)
    console.log('프로젝트 ID:', supabaseUrl?.split('.')[0]?.split('//')[1])

    // 3. Storage URL 패턴 확인
    console.log('\n🔗 3단계: Storage URL 패턴')
    const projectId = supabaseUrl?.split('.')[0]?.split('//')[1]
    console.log('Storage Base URL:', `${supabaseUrl}/storage/v1/object/public/`)
    console.log('이미지 URL 예시:', `${supabaseUrl}/storage/v1/object/public/images/example.jpg`)
    console.log('비디오 URL 예시:', `${supabaseUrl}/storage/v1/object/public/videos/example.mp4`)

    // 4. 필요한 버킷 목록
    console.log('\n📋 4단계: 필요한 버킷 목록')
    const requiredBuckets = [
      {
        name: 'images',
        purpose: 'AI 생성 이미지 저장',
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: '50MB'
      },
      {
        name: 'videos',
        purpose: 'AI 생성 비디오 저장',
        mimeTypes: ['video/mp4', 'video/webm'],
        maxSize: '500MB'
      },
      {
        name: 'thumbnails',
        purpose: '비디오 썸네일 이미지',
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: '10MB'
      }
    ]

    requiredBuckets.forEach(bucket => {
      const exists = buckets?.some(b => b.name === bucket.name)
      console.log(`${exists ? '✅' : '❌'} ${bucket.name}: ${bucket.purpose}`)
      if (!exists) {
        console.log(`   형식: ${bucket.mimeTypes.join(', ')}`)
        console.log(`   크기: ${bucket.maxSize}`)
      }
    })

    // 5. 다음 단계 안내
    console.log('\n🚀 5단계: 다음 단계')
    if (!buckets || buckets.length === 0) {
      console.log('📝 Supabase Dashboard에서 버킷을 수동으로 생성해야 합니다:')
      console.log('1. https://supabase.com/dashboard/project/' + projectId + '/storage/buckets')
      console.log('2. "New bucket" 버튼 클릭')
      console.log('3. 각 버킷을 다음 설정으로 생성:')

      requiredBuckets.forEach(bucket => {
        console.log(`\n   ${bucket.name} 버킷:`)
        console.log(`   - Name: ${bucket.name}`)
        console.log(`   - Public: true`)
        console.log(`   - File size limit: ${bucket.maxSize}`)
        console.log(`   - Allowed MIME types: ${bucket.mimeTypes.join(', ')}`)
      })
    } else {
      console.log('✅ 버킷이 이미 설정되어 있습니다!')
    }

    console.log('\n✅ Storage 상태 확인 완료!')

  } catch (error) {
    console.error('❌ Storage 확인 실패:', error.message)
  }
}

checkStorageWithAnon()