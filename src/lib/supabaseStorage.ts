/**
 * Supabase Storage 통합 관리 시스템
 * 이미지, 비디오, 썸네일 버킷 관리 및 파일 업로드/다운로드
 */

import { supabase, supabaseAdmin, validateSupabaseConfig } from './supabase'
import { shouldUseSupabase } from './environment'

// Storage 버킷 이름 상수
export const STORAGE_BUCKETS = {
  IMAGES: 'images',
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails'
} as const

export interface SupabaseMedia {
  id: string
  fileName: string
  url: string          // Public URL (예: /uploads/filename.jpg)
  originalUrl: string  // 원본 URL (동일)
  type: 'image' | 'video'
  width: number
  height: number
  fileSize: number
  bucketPath: string   // 파일 경로 (예: uploads/filename.jpg)
  uploadedAt: string
  duration?: number    // 비디오용
  resolution?: string  // 비디오용
  metadata?: Record<string, any>
}

// 메인 버킷 설정 - images, videos, thumbnails 모두 'media' 버킷에 폴더별로 구분
const BUCKET_NAME = 'media'

/**
 * Supabase Storage 초기화 및 버킷 생성
 */
export async function initializeSupabaseStorage(): Promise<boolean> {
  try {
    validateSupabaseConfig()

    // 버킷 존재 확인
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      console.error('❌ 버킷 목록 조회 실패:', listError)
      return false
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      console.log('🔄 AI Gallery 버킷 생성 중...')

      const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,  // 공개 접근 허용
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime'
        ],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB per file
      })

      if (createError) {
        console.error('❌ 버킷 생성 실패:', createError)
        return false
      }

      console.log('✅ AI Gallery 버킷 생성 완료:', bucket)
    } else {
      console.log('✅ AI Gallery 버킷 이미 존재함')
    }

    return true
  } catch (error) {
    console.error('❌ Supabase Storage 초기화 실패:', error)
    return false
  }
}

/**
 * API Route를 통한 Supabase Storage 파일 업로드
 */
export async function uploadToSupabaseStorage(
  file: File,
  metadata: Partial<SupabaseMedia>
): Promise<SupabaseMedia> {
  try {
    console.log(`🔄 API Route를 통한 Supabase 업로드 시작: ${file.name}`)
    console.log(`📊 파일 정보:`, {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })

    // FormData 생성
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    console.log(`📤 API Route로 업로드 요청 중...`)

    // API Route를 통한 업로드
    const response = await fetch('/api/supabase/storage?action=upload', {
      method: 'POST',
      body: formData
    })

    console.log(`📡 API 응답 상태: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 요청 실패:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`API 요청 실패: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error('❌ API 응답 에러:', result.error)
      throw new Error(`업로드 실패: ${result.error}`)
    }

    console.log(`✅ API Route 업로드 성공:`, result.data)
    return result.data as SupabaseMedia

  } catch (error) {
    console.error('❌ uploadToSupabaseStorage 실패:', {
        error: error instanceof Error ? error.message : String(error),
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        timestamp: new Date().toISOString()
      })
      throw error
    }
}

/**
 * 메타데이터를 JSON 파일로 저장
 */
async function saveMediaMetadata(media: SupabaseMedia) {
  try {
    const metadataPath = `metadata/${media.id}.json`
    const metadataBlob = new Blob([JSON.stringify(media, null, 2)], {
      type: 'application/json'
    })

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(metadataPath, metadataBlob, {
        contentType: 'application/json',
        upsert: true
      })

    if (error) {
      console.warn('⚠️ 메타데이터 저장 실패:', error.message)
    }
  } catch (error) {
    console.warn('⚠️ 메타데이터 저장 오류:', error)
  }
}

/**
 * 모든 업로드된 미디어 목록 가져오기
 */
export async function getAllSupabaseMedia(): Promise<SupabaseMedia[]> {
  // 로컬 환경에서는 빈 배열 반환
  if (!shouldUseSupabase()) {
    console.log('🏠 로컬 환경: Supabase 미디어 목록 조회 생략')
    return []
  }

  try {
    validateSupabaseConfig()
    console.log('🔄 Supabase Storage에서 미디어 목록 조회 중...')

    const allMedia: SupabaseMedia[] = []
    const folders = ['images', 'videos']

    for (const folder of folders) {
      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.warn(`⚠️ ${folder} 폴더 조회 실패:`, error.message)
        continue
      }

      if (!files) continue

      for (const file of files) {
        if (!file.name || file.name === '.emptyFolderPlaceholder') continue

        // 공개 URL 생성
        const filePath = `${folder}/${file.name}`
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)

        // 메타데이터 파일 시도 로드
        const metadataPath = `metadata/${file.name.split('.')[0]}.json`
        let savedMetadata = null
        try {
          const { data: metadataFile } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .download(metadataPath)

          if (metadataFile) {
            const metadataText = await metadataFile.text()
            savedMetadata = JSON.parse(metadataText)
          }
        } catch (metaError) {
          // 메타데이터 파일이 없으면 기본값 사용
        }

        const isVideo = folder === 'videos'
        const fileId = file.name.split('.')[0]

        const media: SupabaseMedia = {
          id: fileId,
          fileName: savedMetadata?.fileName || file.name,
          url: urlData.publicUrl,
          originalUrl: urlData.publicUrl,
          type: isVideo ? 'video' : 'image',
          width: savedMetadata?.width || (isVideo ? 1920 : 800),
          height: savedMetadata?.height || (isVideo ? 1080 : 600),
          fileSize: file.metadata?.size || savedMetadata?.fileSize || 0,
          bucketPath: filePath,
          uploadedAt: file.created_at || new Date().toISOString(),
          duration: isVideo ? savedMetadata?.duration : undefined,
          resolution: isVideo ? savedMetadata?.resolution || '1920x1080' : undefined,
          metadata: {
            ...file.metadata,
            ...savedMetadata?.metadata
          }
        }

        allMedia.push(media)
      }
    }

    // 최신순으로 정렬
    const sortedMedia = allMedia.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )

    console.log(`✅ Supabase에서 ${sortedMedia.length}개 미디어 로드 완료`)
    console.log(`📷 이미지: ${sortedMedia.filter(m => m.type === 'image').length}개`)
    console.log(`🎬 비디오: ${sortedMedia.filter(m => m.type === 'video').length}개`)

    return sortedMedia

  } catch (error) {
    console.error('❌ Supabase 미디어 목록 조회 실패:', error)
    return []
  }
}

/**
 * 미디어 파일 삭제 (API Route 사용)
 */
export async function deleteSupabaseMedia(mediaId: string): Promise<boolean> {
  try {
    console.log(`🗑️ API Route를 통한 Supabase 파일 삭제 중: ${mediaId}`)

    // API Route를 통한 삭제 요청
    const response = await fetch(`/api/supabase/storage?id=${mediaId}`, {
      method: 'DELETE'
    })

    console.log(`📡 삭제 API 응답 상태: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API 삭제 요청 실패: ${response.status} ${errorText}`)
      return false
    }

    const result = await response.json()

    if (result.success) {
      console.log(`✅ API Route 삭제 성공: ${mediaId}`)
      return true
    } else {
      console.error(`❌ API 삭제 실패:`, result.error)
      return false
    }

  } catch (error) {
    console.error('❌ API Route 삭제 요청 실패:', error)
    return false
  }
}

/**
 * 저장공간 사용량 확인
 */
export async function getSupabaseStorageUsage() {
  // 로컬 환경에서는 빈 데이터 반환
  if (!shouldUseSupabase()) {
    console.log('🏠 로컬 환경: Supabase Storage 사용량 확인 생략')
    return {
      totalFiles: 0,
      mediaCount: 0,
      estimatedSize: 0,
      sizeFormatted: '0 B',
      folders: []
    }
  }

  try {
    validateSupabaseConfig()

    let totalFiles = 0
    let mediaCount = 0
    let estimatedSize = 0

    const folders = ['images', 'videos', 'metadata']

    for (const folder of folders) {
      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, { limit: 1000 })

      if (error) {
        console.warn(`⚠️ ${folder} 폴더 사용량 조회 실패:`, error.message)
        continue
      }

      if (files) {
        totalFiles += files.length

        // 실제 미디어 파일만 카운트 (메타데이터 제외)
        if (folder !== 'metadata') {
          const mediaFiles = files.filter(file =>
            file.name && file.name !== '.emptyFolderPlaceholder'
          )
          mediaCount += mediaFiles.length

          // 파일 크기 추정 (메타데이터에서 가져올 수 있으면 사용)
          estimatedSize += mediaFiles.reduce((sum, file) => {
            return sum + (file.metadata?.size || 0)
          }, 0)
        }
      }
    }

    // 1GB = 1,073,741,824 bytes (Supabase 무료 한도)
    const freeLimit = 1 * 1024 * 1024 * 1024
    const usagePercent = estimatedSize > 0 ? (estimatedSize / freeLimit) * 100 : 0

    return {
      totalFiles,
      mediaCount,
      totalSize: estimatedSize,
      usagePercent: Math.min(usagePercent, 100),
      freeLimit,
      breakdown: {
        images: 0, // 개별 폴더별 상세 정보는 필요시 구현
        videos: 0,
        metadata: 0
      }
    }
  } catch (error) {
    console.error('❌ 사용량 조회 실패:', error)
    return {
      totalFiles: 0,
      mediaCount: 0,
      totalSize: 0,
      usagePercent: 0,
      freeLimit: 1024 * 1024 * 1024
    }
  }
}

/**
 * Storage 버킷 상태 확인
 */
export async function checkSupabaseStorageStatus() {
  try {
    validateSupabaseConfig()

    // 버킷 존재 확인
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      return {
        isConnected: false,
        bucketExists: false,
        error: listError.message
      }
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME) || false

    if (!bucketExists) {
      return {
        isConnected: true,
        bucketExists: false,
        error: `버킷 '${BUCKET_NAME}'이 존재하지 않습니다`
      }
    }

    // 폴더 구조 확인
    const requiredFolders = ['images', 'videos', 'metadata']
    const folderStatus: Record<string, boolean> = {}

    for (const folder of requiredFolders) {
      const { data: files, error: folderError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, { limit: 1 })

      folderStatus[folder] = !folderError
    }

    return {
      isConnected: true,
      bucketExists: true,
      bucketName: BUCKET_NAME,
      folders: folderStatus,
      error: null
    }
  } catch (error) {
    return {
      isConnected: false,
      bucketExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 강제로 모든 Storage 파일 삭제 (수동 복구용)
 */
export async function forceDeleteAllStorageFiles(): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  try {
    validateSupabaseConfig()
    console.log('🚨 강제 전체 삭제 시작: Storage의 모든 파일 삭제')

    const errors: string[] = []
    let deletedCount = 0

    // 각 폴더별로 모든 파일 나열 및 삭제
    const folders = ['images', 'videos', 'metadata']

    for (const folder of folders) {
      console.log(`🗂️ ${folder} 폴더 정리 중...`)

      // 폴더의 모든 파일 나열
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, { limit: 1000 })

      if (listError) {
        console.warn(`⚠️ ${folder} 폴더 나열 실패:`, listError.message)
        errors.push(`${folder} 폴더 나열 실패: ${listError.message}`)
        continue
      }

      if (!files || files.length === 0) {
        console.log(`✅ ${folder} 폴더가 이미 비어있습니다`)
        continue
      }

      // 파일 경로 생성
      const filePaths = files.map(file => `${folder}/${file.name}`)

      console.log(`🗑️ ${folder} 폴더에서 ${filePaths.length}개 파일 삭제 중...`)

      // 배치 삭제 (최대 100개씩)
      const batchSize = 100
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize)

        const { error: deleteError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .remove(batch)

        if (deleteError) {
          console.error(`❌ ${folder} 배치 삭제 실패:`, deleteError.message)
          errors.push(`${folder} 배치 삭제 실패: ${deleteError.message}`)
        } else {
          deletedCount += batch.length
          console.log(`✅ ${folder}에서 ${batch.length}개 파일 삭제 완료`)
        }
      }
    }

    console.log(`🎯 강제 삭제 완료: ${deletedCount}개 파일 삭제, ${errors.length}개 오류`)

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    }
  } catch (error) {
    console.error('❌ 강제 삭제 실패:', error)
    return {
      success: false,
      deletedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}