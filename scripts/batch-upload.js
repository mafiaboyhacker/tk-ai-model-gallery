/**
 * 배치 업로드 스크립트 - @픽스 폴더(이미지) + @영상_픽스 폴더(동영상) 자동 업로드
 * Railway API를 통한 대량 파일 업로드 자동화
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')
const config = require('./upload-config')

// Railway API 설정
const RAILWAY_API_BASE = config.api.baseUrl
const UPLOAD_ENDPOINT = `${RAILWAY_API_BASE}${config.api.uploadEndpoint}`

// 폴더 경로 설정
const FOLDERS = config.folders

// 지원 파일 형식
const SUPPORTED_FORMATS = config.supportedFormats

// 업로드 통계
let stats = {
  images: { total: 0, success: 0, failed: 0 },
  videos: { total: 0, success: 0, failed: 0 }
}

/**
 * 폴더에서 지원되는 파일들 스캔
 */
function scanFolder(folderPath, supportedExtensions) {
  if (!fs.existsSync(folderPath)) {
    console.log(`❌ 폴더를 찾을 수 없습니다: ${folderPath}`)
    return []
  }

  const files = fs.readdirSync(folderPath)
  const validFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase()
    return supportedExtensions.includes(ext)
  })

  console.log(`📂 ${folderPath}: ${validFiles.length}개 파일 발견`)
  return validFiles.map(file => path.join(folderPath, file))
}

/**
 * 단일 파일 업로드
 */
async function uploadFile(filePath, fileType) {
  try {
    const fileName = path.basename(filePath)
    const fileStats = fs.statSync(filePath)

    console.log(`🔄 업로드 중: ${fileName} (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`)

    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))

    // 메타데이터 추가
    const metadata = {
      width: fileType === 'image' ? 800 : 1920,
      height: fileType === 'image' ? 600 : 1080
    }
    if (fileType === 'video') {
      metadata.duration = 30 // 기본값
      metadata.resolution = '1920x1080'
    }
    formData.append('metadata', JSON.stringify(metadata))

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
      timeout: config.api.timeout
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ 성공: ${fileName} → ${result.data.title}`)
      return { success: true, fileName, result }
    } else {
      const error = await response.text()
      console.log(`❌ 실패: ${fileName} - ${error}`)
      return { success: false, fileName, error }
    }

  } catch (error) {
    console.log(`❌ 오류: ${path.basename(filePath)} - ${error.message}`)
    return { success: false, fileName: path.basename(filePath), error: error.message }
  }
}

/**
 * 파일 배열 배치 업로드
 */
async function batchUpload(files, fileType, concurrency = 3) {
  const total = files.length
  stats[fileType + 's'].total = total

  console.log(`\n🚀 ${fileType.toUpperCase()} 배치 업로드 시작: ${total}개 파일`)
  console.log(`📊 동시 업로드 수: ${concurrency}개`)

  // 파일을 청크로 나누어 처리
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency)

    console.log(`\n📦 청크 ${Math.floor(i/concurrency) + 1}/${Math.ceil(files.length/concurrency)}: ${chunk.length}개 파일`)

    const promises = chunk.map(file => uploadFile(file, fileType))
    const results = await Promise.all(promises)

    // 결과 집계
    results.forEach(result => {
      if (result.success) {
        stats[fileType + 's'].success++
      } else {
        stats[fileType + 's'].failed++
      }
    })

    // 진행 상황 출력
    const progress = Math.round(((i + chunk.length) / total) * 100)
    console.log(`📈 진행률: ${progress}% (${stats[fileType + 's'].success + stats[fileType + 's'].failed}/${total})`)

    // 서버 부하 방지를 위한 딜레이
    if (i + concurrency < files.length) {
      console.log('⏳ 서버 쿨다운 중... (2초)')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

/**
 * 최종 통계 출력
 */
function printFinalStats() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 최종 업로드 결과')
  console.log('='.repeat(60))

  console.log(`📷 이미지:`)
  console.log(`   - 총 파일: ${stats.images.total}개`)
  console.log(`   - 성공: ${stats.images.success}개`)
  console.log(`   - 실패: ${stats.images.failed}개`)
  console.log(`   - 성공률: ${stats.images.total > 0 ? Math.round((stats.images.success / stats.images.total) * 100) : 0}%`)

  console.log(`🎥 동영상:`)
  console.log(`   - 총 파일: ${stats.videos.total}개`)
  console.log(`   - 성공: ${stats.videos.success}개`)
  console.log(`   - 실패: ${stats.videos.failed}개`)
  console.log(`   - 성공률: ${stats.videos.total > 0 ? Math.round((stats.videos.success / stats.videos.total) * 100) : 0}%`)

  const totalSuccess = stats.images.success + stats.videos.success
  const totalFiles = stats.images.total + stats.videos.total

  console.log(`\n🎯 전체 요약:`)
  console.log(`   - 총 업로드: ${totalSuccess}/${totalFiles}개`)
  console.log(`   - 전체 성공률: ${totalFiles > 0 ? Math.round((totalSuccess / totalFiles) * 100) : 0}%`)

  if (totalSuccess > 0) {
    console.log(`\n✅ 업로드 완료! Railway 갤러리에서 확인하세요:`)
    console.log(`   🌐 ${RAILWAY_API_BASE}`)
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Railway 배치 업로드 시작!')
  console.log(`📍 타겟: ${RAILWAY_API_BASE}`)

  try {
    // 1. 이미지 파일 스캔 및 업로드
    const imageFiles = scanFolder(FOLDERS.images, SUPPORTED_FORMATS.images)
    if (imageFiles.length > 0) {
      await batchUpload(imageFiles, 'image', config.upload.imageConcurrency)
    }

    // 2. 동영상 파일 스캔 및 업로드
    const videoFiles = scanFolder(FOLDERS.videos, SUPPORTED_FORMATS.videos)
    if (videoFiles.length > 0) {
      await batchUpload(videoFiles, 'video', config.upload.videoConcurrency)
    }

    // 3. 최종 결과 출력
    printFinalStats()

  } catch (error) {
    console.error('❌ 치명적 오류:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { uploadFile, batchUpload, scanFolder }