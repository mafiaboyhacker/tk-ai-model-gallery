/**
 * Vercel Blob Storage 관리
 * 무료 티어: 500MB 저장공간 + 1GB 대역폭/월
 */

import { put, del, list, head } from '@vercel/blob'

export interface UploadedMedia {
  id: string
  fileName: string
  url: string          // Vercel Blob URL
  originalUrl: string  // 원본 URL (동일)
  type: 'image' | 'video'
  width: number
  height: number
  fileSize: number
  uploadedAt: string
  duration?: number    // 비디오용
  resolution?: string  // 비디오용
}

/**
 * 파일을 Vercel Blob Storage에 업로드
 */
export async function uploadToVercelBlob(
  file: File,
  metadata: Partial<UploadedMedia>
): Promise<UploadedMedia> {
  try {
    // 고유 파일명 생성
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const blobFileName = `${timestamp}_${sanitizedName}`

    // Vercel Blob에 업로드
    const blob = await put(blobFileName, file, {
      access: 'public',
      contentType: file.type
    })

    // 미디어 객체 생성
    const uploadedMedia: UploadedMedia = {
      id: `blob_${timestamp}`,
      fileName: file.name,
      url: blob.url,
      originalUrl: blob.url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      width: metadata.width || 800,
      height: metadata.height || 600,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      duration: metadata.duration,
      resolution: metadata.resolution
    }

    // 메타데이터도 별도 파일로 저장 (검색/관리용)
    await saveMetadata(uploadedMedia)

    return uploadedMedia
  } catch (error) {
    console.error('Vercel Blob 업로드 실패:', error)
    throw new Error(`업로드 실패: ${error}`)
  }
}

/**
 * 메타데이터 저장 (JSON 파일로)
 */
async function saveMetadata(media: UploadedMedia) {
  try {
    const metadataFileName = `metadata_${media.id}.json`
    const metadataBlob = new Blob([JSON.stringify(media, null, 2)], {
      type: 'application/json'
    })

    await put(metadataFileName, metadataBlob, {
      access: 'public'
    })
  } catch (error) {
    console.warn('메타데이터 저장 실패 (업로드는 성공):', error)
  }
}

/**
 * 모든 업로드된 미디어 목록 가져오기
 */
export async function getAllUploadedMedia(): Promise<UploadedMedia[]> {
  try {
    const { blobs } = await list()

    // 메타데이터 파일만 필터링
    const metadataBlobs = blobs.filter(blob =>
      blob.pathname.startsWith('metadata_') && blob.pathname.endsWith('.json')
    )

    // 각 메타데이터 파일에서 미디어 정보 추출
    const mediaPromises = metadataBlobs.map(async (blob) => {
      try {
        const response = await fetch(blob.url)
        const media: UploadedMedia = await response.json()
        return media
      } catch (error) {
        console.warn('메타데이터 파싱 실패:', blob.pathname, error)
        return null
      }
    })

    const mediaResults = await Promise.all(mediaPromises)
    const validMedia = mediaResults.filter(Boolean) as UploadedMedia[]

    // 업로드 시간 순으로 정렬 (최신순)
    return validMedia.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  } catch (error) {
    console.error('미디어 목록 조회 실패:', error)
    return []
  }
}

/**
 * 미디어 파일 삭제
 */
export async function deleteMedia(mediaId: string): Promise<boolean> {
  try {
    const { blobs } = await list()

    // 해당 미디어와 관련된 모든 blob 찾기
    const mediaBlobs = blobs.filter(blob =>
      blob.pathname.includes(mediaId.replace('blob_', ''))
    )

    // 모든 관련 blob 삭제
    const deletePromises = mediaBlobs.map(blob => del(blob.url))
    await Promise.all(deletePromises)

    console.log(`미디어 삭제 완료: ${mediaId}`)
    return true
  } catch (error) {
    console.error('미디어 삭제 실패:', error)
    return false
  }
}

/**
 * 저장공간 사용량 확인
 */
export async function getStorageUsage() {
  try {
    const { blobs } = await list()

    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0)
    const totalCount = blobs.length

    // 미디어 파일과 메타데이터 파일 구분
    const mediaFiles = blobs.filter(blob =>
      !blob.pathname.startsWith('metadata_')
    )
    const metadataFiles = blobs.filter(blob =>
      blob.pathname.startsWith('metadata_')
    )

    return {
      totalSize,
      totalCount,
      mediaCount: mediaFiles.length,
      metadataCount: metadataFiles.length,
      // 무료 한도 기준 사용률
      usagePercent: Math.round((totalSize / (500 * 1024 * 1024)) * 100) // 500MB 기준
    }
  } catch (error) {
    console.error('저장공간 사용량 확인 실패:', error)
    return {
      totalSize: 0,
      totalCount: 0,
      mediaCount: 0,
      metadataCount: 0,
      usagePercent: 0
    }
  }
}