/**
 * 정적 파일 저장소 통합 관리 (Public/Uploads)
 * 로컬 정적 파일 시스템 사용 (Supabase 대안)
 */

import { supabaseAdmin, validateSupabaseConfig } from './supabase'

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
 * 파일을 정적 저장소에 업로드 (API 엔드포인트 사용)
 */
export async function uploadToSupabaseStorage(
  file: File,
  metadata: Partial<SupabaseMedia>
): Promise<SupabaseMedia> {
  try {
    console.log(`🔄 정적 파일 업로드 시작: ${file.name}`)

    // FormData 생성
    const formData = new FormData()
    formData.append('files', file)

    // API 엔드포인트로 업로드
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success || !result.files || result.files.length === 0) {
      throw new Error('업로드 결과가 비어있습니다.')
    }

    // API 응답을 SupabaseMedia 형식으로 변환
    const uploadedFile = result.files[0]
    const uploadedMedia: SupabaseMedia = {
      id: uploadedFile.id,
      fileName: uploadedFile.fileName,
      url: uploadedFile.url, // 예: /uploads/uuid.jpg
      originalUrl: uploadedFile.originalUrl || uploadedFile.url,
      type: uploadedFile.type,
      width: uploadedFile.width || metadata.width || 800,
      height: uploadedFile.height || metadata.height || 600,
      fileSize: uploadedFile.size,
      bucketPath: uploadedFile.path, // 예: uploads/uuid.jpg
      uploadedAt: uploadedFile.uploadedAt,
      duration: uploadedFile.duration,
      resolution: metadata.resolution,
      metadata: {
        originalType: uploadedFile.mimeType,
        uploadedAt: Date.parse(uploadedFile.uploadedAt),
        fileName: uploadedFile.fileName
      }
    }

    console.log(`✅ 정적 파일 업로드 완료: ${file.name}`)
    return uploadedMedia
  } catch (error) {
    console.error('❌ 정적 파일 업로드 실패:', error)
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
 * 모든 업로드된 미디어 목록 가져오기 (Zustand store에서 조회)
 * 정적 파일 시스템에서는 브라우저 localStorage를 통해 관리
 */
export async function getAllSupabaseMedia(): Promise<SupabaseMedia[]> {
  try {
    console.log('🔄 Supabase Storage에서 미디어 목록 조회 중...')

    // 모든 미디어 파일을 가져오기 (images, videos 폴더)
    const allMedia: SupabaseMedia[] = []

    // 1. images 폴더에서 이미지 파일들 가져오기
    const { data: imageFiles, error: imageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('images', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    if (!imageError && imageFiles) {
      for (const file of imageFiles) {
        if (file.name && file.name !== '.emptyFolderPlaceholder') {
          const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`images/${file.name}`)

          const media: SupabaseMedia = {
            id: file.name.split('.')[0], // UUID from filename
            fileName: file.name,
            url: urlData.publicUrl,
            originalUrl: urlData.publicUrl,
            type: 'image',
            width: 800, // Default values - could enhance to get actual dimensions
            height: 600,
            fileSize: file.metadata?.size || 0,
            bucketPath: `images/${file.name}`,
            uploadedAt: file.created_at || new Date().toISOString(),
            metadata: file.metadata
          }
          allMedia.push(media)
        }
      }
    }

    // 2. videos 폴더에서 비디오 파일들 가져오기
    const { data: videoFiles, error: videoError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('videos', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    if (!videoError && videoFiles) {
      for (const file of videoFiles) {
        if (file.name && file.name !== '.emptyFolderPlaceholder') {
          const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`videos/${file.name}`)

          const media: SupabaseMedia = {
            id: file.name.split('.')[0], // UUID from filename
            fileName: file.name,
            url: urlData.publicUrl,
            originalUrl: urlData.publicUrl,
            type: 'video',
            width: 1920, // Default values
            height: 1080,
            duration: 30, // Default duration
            resolution: '1920x1080',
            fileSize: file.metadata?.size || 0,
            bucketPath: `videos/${file.name}`,
            uploadedAt: file.created_at || new Date().toISOString(),
            metadata: file.metadata
          }
          allMedia.push(media)
        }
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
 * 미디어 파일 삭제 (API 엔드포인트 사용)
 */
export async function deleteSupabaseMedia(mediaId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Supabase 파일 삭제 중: ${mediaId}`)

    // 먼저 현재 미디어 목록에서 파일 정보 찾기
    const mediaList = await getAllSupabaseMedia()
    const targetMedia = mediaList.find(m => m.id === mediaId)

    if (!targetMedia) {
      console.error('❌ 삭제할 미디어를 찾을 수 없습니다:', mediaId)
      return false
    }

    // bucketPath를 사용하거나 없으면 파일명으로 경로 구성
    let filePath = targetMedia.bucketPath
    if (!filePath) {
      // bucketPath가 없으면 type과 fileName으로 경로 구성
      const folder = targetMedia.type === 'image' ? 'images' : 'videos'
      filePath = `${folder}/${targetMedia.fileName || `${mediaId}.${targetMedia.type === 'image' ? 'png' : 'mp4'}`}`
    }

    console.log(`🗑️ 삭제할 파일 경로: ${filePath}`)

    // API 엔드포인트로 삭제 요청 (path 파라미터 사용)
    const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ API 삭제 실패:', errorData)
      return false
    }

    const result = await response.json()

    if (!result.success) {
      console.error('❌ 삭제 결과 실패:', result)
      return false
    }

    console.log(`✅ Supabase 파일 삭제 완료: ${mediaId} (${filePath})`)
    return true
  } catch (error) {
    console.error('❌ Supabase 파일 삭제 실패:', error)
    return false
  }
}

/**
 * 저장공간 사용량 확인
 */
export async function getSupabaseStorageUsage() {
  try {
    const { data: usage, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 })

    if (error) {
      // HTML 응답이나 네트워크 오류 체크
      if (typeof error === 'object' && error.message) {
        const errorMessage = error.message.toString()
        if (errorMessage.includes('Unexpected token') || errorMessage.includes('<html>')) {
          console.error('❌ 사용량 조회 실패: Supabase API가 HTML을 반환했습니다 (서비스 장애 가능성)', error)
        } else {
          console.error('❌ 사용량 조회 실패:', error)
        }
      } else {
        console.error('❌ 사용량 조회 실패:', error)
      }

      return {
        totalFiles: 0,
        totalSize: 0,
        usagePercent: 0,
        mediaCount: 0
      }
    }

    const totalFiles = usage?.length || 0
    const mediaFiles = usage?.filter(file =>
      !file.name.startsWith('metadata/') &&
      !file.name.startsWith('.emptyFolderPlaceholder')
    ) || []

    // 1GB = 1,073,741,824 bytes (무료 한도)
    const freeLimit = 1 * 1024 * 1024 * 1024

    return {
      totalFiles,
      mediaCount: mediaFiles.length,
      totalSize: 0, // Supabase에서 직접 용량 정보 제공 안함
      usagePercent: 0, // 실제 사용량은 Dashboard에서 확인
      freeLimit
    }
  } catch (error) {
    console.error('❌ 사용량 조회 실패:', error)
    return {
      totalFiles: 0,
      totalSize: 0,
      usagePercent: 0,
      mediaCount: 0
    }
  }
}