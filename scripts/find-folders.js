/**
 * @픽스, @영상_픽스 폴더 자동 탐지 스크립트
 */

const fs = require('fs')
const path = require('path')

// 검색할 루트 경로들
const SEARCH_ROOTS = [
  'C:\\Users\\TK\\Desktop',
  'C:\\Users\\TK\\Documents',
  'C:\\Users\\TK\\Downloads',
  'C:\\Users\\TK\\Documents\\llmcode',
  'C:\\Users\\TK\\Documents\\llmcode\\tkbm',
  'C:\\Users\\TK\\Documents\\llmcode\\tkbm\\tk_infl'
]

// 대상 폴더명들
const TARGET_FOLDERS = ['@픽스', '@영상_픽스', '픽스', '영상_픽스']

/**
 * 재귀적으로 폴더 검색
 */
function searchFolders(rootPath, targetNames, maxDepth = 3, currentDepth = 0) {
  const found = []

  if (currentDepth >= maxDepth || !fs.existsSync(rootPath)) {
    return found
  }

  try {
    const items = fs.readdirSync(rootPath, { withFileTypes: true })

    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = path.join(rootPath, item.name)

        // 대상 폴더명과 일치하는지 확인
        if (targetNames.some(target =>
          item.name.toLowerCase().includes(target.toLowerCase().replace('@', ''))
        )) {
          // 폴더 내 파일 개수 확인
          try {
            const files = fs.readdirSync(fullPath)
            const fileCount = files.length

            found.push({
              name: item.name,
              path: fullPath,
              fileCount: fileCount,
              type: item.name.includes('영상') || item.name.includes('video') ? 'video' : 'image'
            })

            console.log(`✅ 발견: ${item.name} (${fileCount}개 파일) - ${fullPath}`)
          } catch (err) {
            console.log(`⚠️  접근 불가: ${fullPath}`)
          }
        }

        // 재귀 검색 (너무 깊이 들어가지 않도록 제한)
        if (currentDepth < maxDepth - 1) {
          found.push(...searchFolders(fullPath, targetNames, maxDepth, currentDepth + 1))
        }
      }
    }
  } catch (error) {
    // 접근 권한 없는 폴더는 무시
  }

  return found
}

/**
 * 메인 검색 함수
 */
function findTargetFolders() {
  console.log('🔍 @픽스, @영상_픽스 폴더 검색 중...')

  const allFound = []

  for (const root of SEARCH_ROOTS) {
    console.log(`📂 검색 중: ${root}`)
    const found = searchFolders(root, TARGET_FOLDERS, 3)
    allFound.push(...found)
  }

  if (allFound.length === 0) {
    console.log('❌ 대상 폴더를 찾을 수 없습니다.')
    console.log('💡 수동으로 폴더 경로를 scripts/upload-config.js에서 설정해주세요.')
    return null
  }

  // 결과 정리
  const imageFolders = allFound.filter(f => f.type === 'image')
  const videoFolders = allFound.filter(f => f.type === 'video')

  console.log('\n📊 검색 결과:')
  console.log('='.repeat(50))

  if (imageFolders.length > 0) {
    console.log('📷 이미지 폴더:')
    imageFolders.forEach(folder => {
      console.log(`   - ${folder.name}: ${folder.fileCount}개 파일`)
      console.log(`     경로: ${folder.path}`)
    })
  }

  if (videoFolders.length > 0) {
    console.log('🎥 동영상 폴더:')
    videoFolders.forEach(folder => {
      console.log(`   - ${folder.name}: ${folder.fileCount}개 파일`)
      console.log(`     경로: ${folder.path}`)
    })
  }

  // 가장 파일이 많은 폴더를 자동 선택
  const bestImageFolder = imageFolders.reduce((best, current) =>
    current.fileCount > (best?.fileCount || 0) ? current : best, null)
  const bestVideoFolder = videoFolders.reduce((best, current) =>
    current.fileCount > (best?.fileCount || 0) ? current : best, null)

  return {
    imageFolder: bestImageFolder,
    videoFolder: bestVideoFolder,
    allFound
  }
}

/**
 * 설정 파일 업데이트
 */
function updateConfig(result) {
  if (!result || (!result.imageFolder && !result.videoFolder)) {
    console.log('❌ 설정 업데이트 불가: 폴더를 찾지 못했습니다.')
    return false
  }

  try {
    const configPath = path.join(__dirname, 'upload-config.js')
    let configContent = fs.readFileSync(configPath, 'utf8')

    if (result.imageFolder) {
      const imagePath = result.imageFolder.path.replace(/\\/g, '\\\\')
      configContent = configContent.replace(
        /images:\s*['"][^'"]*['"]/,
        `images: '${imagePath}'`
      )
      console.log(`✅ 이미지 폴더 설정: ${result.imageFolder.path}`)
    }

    if (result.videoFolder) {
      const videoPath = result.videoFolder.path.replace(/\\/g, '\\\\')
      configContent = configContent.replace(
        /videos:\s*['"][^'"]*['"]/,
        `videos: '${videoPath}'`
      )
      console.log(`✅ 동영상 폴더 설정: ${result.videoFolder.path}`)
    }

    fs.writeFileSync(configPath, configContent)
    console.log('✅ upload-config.js 업데이트 완료!')
    return true

  } catch (error) {
    console.error('❌ 설정 파일 업데이트 실패:', error.message)
    return false
  }
}

// 스크립트 실행
if (require.main === module) {
  const result = findTargetFolders()
  if (result) {
    updateConfig(result)

    console.log('\n🚀 다음 명령어로 업로드를 시작하세요:')
    console.log('npm run batch-upload')
  }
}

module.exports = { findTargetFolders, updateConfig }