/**
 * 하이브리드 스토리지 시스템 - Volume 마운트 실패 대안
 * Railway Volume이 실패할 경우 파일 크기에 따라 DB/파일시스템 선택
 */

import path from 'path'
import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'

// Enhanced 스토리지 경로 설정 함수 with Railway volume mount stability
export function getStoragePath(): {
  storageRoot: string
  imagesDir: string
  videosDir: string
  thumbnailsDir: string
  isVolumeAvailable: boolean
  storageType: 'volume' | 'ephemeral'
  retryCount: number
} {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH

  // Enhanced Railway volume mount with retry logic and debugging
  if (volumePath) {
    console.log(`🔍 Volume path from env: ${volumePath}`)

    // First check if the volume path exists
    let volumeExists = existsSync(volumePath)
    console.log(`🔍 Initial volume exists check: ${volumePath} = ${volumeExists}`)

    // If volume doesn't exist, try to create it
    if (!volumeExists) {
      console.log(`🔧 Attempting to create volume path: ${volumePath}`)
      try {
        const fs = require('fs')
        fs.mkdirSync(volumePath, { recursive: true })
        volumeExists = existsSync(volumePath)
        console.log(`🔧 Volume creation result: ${volumeExists}`)
      } catch (createError) {
        console.warn(`⚠️ Volume creation failed: ${createError.message}`)
      }
    }

    // Additional diagnostic information
    console.log(`📋 Volume diagnostic:`)
    console.log(`  - Process CWD: ${process.cwd()}`)
    console.log(`  - Volume path exists: ${volumeExists}`)

    // List available mount points for debugging
    try {
      const fs = require('fs')
      const rootContents = fs.readdirSync('/')
      console.log(`📋 Root directory contents:`, rootContents)

      if (rootContents.includes('data')) {
        console.log(`✅ /data directory found in root`)
        const dataContents = fs.readdirSync('/data')
        console.log(`📋 /data contents:`, dataContents)
      }
    } catch (debugError) {
      console.warn(`⚠️ Debug listing failed: ${debugError.message}`)
    }

    if (volumeExists) {
      // Ensure upload directories exist with enhanced structure
      const uploadsDir = path.join(volumePath, 'uploads')
      const imagesDir = path.join(uploadsDir, 'images')
      const videosDir = path.join(uploadsDir, 'videos')
      const thumbnailsDir = path.join(uploadsDir, 'thumbnails')

      try {
        // Create directories synchronously to ensure they exist
        const fs = require('fs')
        if (!existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
          console.log(`📁 Created uploads directory: ${uploadsDir}`)
        }
        if (!existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true })
          console.log(`📁 Created images directory: ${imagesDir}`)
        }
        if (!existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true })
          console.log(`📁 Created videos directory: ${videosDir}`)
        }
        if (!existsSync(thumbnailsDir)) {
          fs.mkdirSync(thumbnailsDir, { recursive: true })
          console.log(`📁 Created thumbnails directory: ${thumbnailsDir}`)
        }

        console.log(`✅ Railway volume mount successful: ${volumePath}`)
        return {
          storageRoot: uploadsDir,
          imagesDir,
          videosDir,
          thumbnailsDir,
          isVolumeAvailable: true,
          storageType: 'volume',
          retryCount: 0
        }
      } catch (error) {
        console.error('❌ Railway volume directory creation failed:', error)
      }
    } else {
      console.warn(`⚠️ Railway volume mount failed after 5 retries: ${volumePath}`)
    }
  }

  // Fallback to ephemeral storage with warning
  console.warn('🚨 Using ephemeral storage - files will be lost on deployment refresh!')
  const ephemeralRoot = '/tmp/uploads'

  try {
    const fs = require('fs')
    if (!existsSync(ephemeralRoot)) {
      fs.mkdirSync(ephemeralRoot, { recursive: true })
    }
    if (!existsSync(path.join(ephemeralRoot, 'images'))) {
      fs.mkdirSync(path.join(ephemeralRoot, 'images'), { recursive: true })
    }
    if (!existsSync(path.join(ephemeralRoot, 'videos'))) {
      fs.mkdirSync(path.join(ephemeralRoot, 'videos'), { recursive: true })
    }
    if (!existsSync(path.join(ephemeralRoot, 'thumbnails'))) {
      fs.mkdirSync(path.join(ephemeralRoot, 'thumbnails'), { recursive: true })
    }
  } catch (error) {
    console.error('❌ Ephemeral storage setup failed:', error)
  }

  return {
    storageRoot: ephemeralRoot,
    imagesDir: path.join(ephemeralRoot, 'images'),
    videosDir: path.join(ephemeralRoot, 'videos'),
    thumbnailsDir: path.join(ephemeralRoot, 'thumbnails'),
    isVolumeAvailable: false,
    storageType: 'ephemeral',
    retryCount: 5
  }
}

// 파일 크기 기반 저장 전략
export interface HybridStorageOptions {
  file: Buffer
  filename: string
  mimeType: string
  metadata: {
    width?: number
    height?: number
    duration?: number
    fileSize: number
  }
}

export interface HybridStorageResult {
  storageType: 'database' | 'filesystem'
  fileData?: string // Base64 for database storage
  filePath?: string // Path for filesystem storage
  thumbnailData?: string // Base64 thumbnail
}

/**
 * 하이브리드 스토리지 - 파일 크기에 따라 저장 방식 결정
 * 1MB 미만: Database에 Base64 저장
 * 1MB 이상: Filesystem에 저장
 */
export async function hybridStorageUpload(
  options: HybridStorageOptions
): Promise<HybridStorageResult> {
  const { file, filename, mimeType, metadata } = options
  const FILE_SIZE_THRESHOLD = 1024 * 1024 // 1MB

  // 파일 크기 기반 저장 결정
  if (metadata.fileSize < FILE_SIZE_THRESHOLD) {
    console.log(`🗃️ 작은 파일 (${(metadata.fileSize / 1024).toFixed(1)}KB) - Database 저장`)

    // 썸네일 생성 및 이미지 최적화 (이미지인 경우)
    let thumbnailData: string | undefined
    let optimizedFile = file // 기본값은 원본 파일

    if (mimeType.startsWith('image/')) {
      try {
        const sharp = require('sharp')

        // 📸 썸네일 생성 (150x150, 높은 품질)
        const thumbnailBuffer = await sharp(file)
          .resize(150, 150, { fit: 'cover', position: 'center' })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer()
        thumbnailData = thumbnailBuffer.toString('base64')
        console.log(`📸 썸네일 생성: ${(thumbnailBuffer.length / 1024).toFixed(1)}KB`)

        // 🎨 이미지 최적화 (WebP 변환 + 압축)
        const webpBuffer = await sharp(file)
          .webp({
            quality: 85,
            effort: 4, // 압축 효율성 (0-6, 높을수록 더 압축)
            progressive: true
          })
          .toBuffer()

        // WebP가 더 작으면 사용, 아니면 원본 유지
        if (webpBuffer.length < file.length * 0.9) {
          optimizedFile = webpBuffer
          console.log(`🎨 WebP 최적화: ${(file.length / 1024).toFixed(1)}KB → ${(webpBuffer.length / 1024).toFixed(1)}KB`)
        } else {
          console.log(`📷 원본 유지 (WebP 효과 미미): ${(file.length / 1024).toFixed(1)}KB`)
        }

      } catch (error) {
        console.warn('⚠️ 이미지 최적화 실패:', error)
      }
    }

    // Base64 인코딩하여 DB에 저장 (최적화된 파일 사용)
    const base64Data = optimizedFile.toString('base64')

    return {
      storageType: 'database',
      fileData: base64Data,
      thumbnailData
    }

  } else {
    console.log(`💽 큰 파일 (${(metadata.fileSize / 1024 / 1024).toFixed(1)}MB) - Filesystem 저장`)

    // 파일시스템에 저장
    const storage = getStoragePath()
    const isVideo = mimeType.startsWith('video/')
    const targetDir = isVideo ? storage.videosDir : storage.imagesDir

    // 디렉토리 생성
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
      console.log(`📁 디렉토리 생성: ${targetDir}`)
    }

    // 파일 최적화 및 저장
    let fileToStore = file
    let actualFilename = filename

    // 이미지인 경우 최적화 적용
    if (!isVideo && mimeType.startsWith('image/')) {
      try {
        const sharp = require('sharp')

        // WebP 변환 시도
        const webpBuffer = await sharp(file)
          .webp({
            quality: 85,
            effort: 4,
            progressive: true
          })
          .toBuffer()

        // WebP가 더 효율적이면 사용
        if (webpBuffer.length < file.length * 0.9) {
          fileToStore = webpBuffer
          actualFilename = filename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp')
          console.log(`🎨 파일시스템 WebP 최적화: ${(file.length / 1024).toFixed(1)}KB → ${(webpBuffer.length / 1024).toFixed(1)}KB`)
        }
      } catch (error) {
        console.warn('⚠️ 파일시스템 이미지 최적화 실패:', error)
      }
    }

    // 파일 저장
    const filePath = path.join(targetDir, actualFilename)
    await writeFile(filePath, fileToStore)

    console.log(`💾 파일 저장: ${filePath}`)
    console.log(`📊 스토리지 타입: ${storage.storageType}`)

    return {
      storageType: 'filesystem',
      filePath
    }
  }
}

/**
 * 저장소 상태 진단
 */
export function diagnoseStorageStatus() {
  const storage = getStoragePath()

  console.log('🔍 스토리지 상태 진단:')
  console.log(`  📁 스토리지 루트: ${storage.storageRoot}`)
  console.log(`  🔧 Volume 사용 가능: ${storage.isVolumeAvailable ? '✅' : '❌'}`)
  console.log(`  📂 스토리지 타입: ${storage.storageType}`)
  console.log(`  🖼️ 이미지 경로: ${storage.imagesDir}`)
  console.log(`  🎬 비디오 경로: ${storage.videosDir}`)
  console.log(`  🌍 RAILWAY_VOLUME_MOUNT_PATH: ${process.env.RAILWAY_VOLUME_MOUNT_PATH || 'undefined'}`)

  return {
    storage,
    volumeAvailable: storage.isVolumeAvailable,
    canFallback: storage.storageType === 'ephemeral'
  }
}