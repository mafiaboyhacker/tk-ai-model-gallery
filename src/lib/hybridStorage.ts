/**
 * 하이브리드 스토리지 시스템 - Volume 마운트 실패 대안
 * Railway Volume이 실패할 경우 파일 크기에 따라 DB/파일시스템 선택
 */

import path from 'path'
import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'

// 스토리지 경로 설정 함수
export function getStoragePath(): {
  storageRoot: string
  imagesDir: string
  videosDir: string
  isVolumeAvailable: boolean
  storageType: 'volume' | 'ephemeral'
} {
  // Railway Volume 마운트 경로 확인
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH

  if (volumePath && existsSync(volumePath)) {
    // Volume 마운트 성공 - 우선 사용
    return {
      storageRoot: volumePath,
      imagesDir: path.join(volumePath, 'images'),
      videosDir: path.join(volumePath, 'videos'),
      isVolumeAvailable: true,
      storageType: 'volume'
    }
  } else {
    // Volume 마운트 실패 - ephemeral storage fallback
    const ephemeralRoot = '/tmp/uploads'
    return {
      storageRoot: ephemeralRoot,
      imagesDir: path.join(ephemeralRoot, 'images'),
      videosDir: path.join(ephemeralRoot, 'videos'),
      isVolumeAvailable: false,
      storageType: 'ephemeral'
    }
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