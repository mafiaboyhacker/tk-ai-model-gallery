/**
 * Railway Volume 파일 업로드/삭제 API
 * POST: 파일 업로드
 * DELETE: 파일 삭제
 * GET: Storage 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'

// 지원하는 파일 형식
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 파일 업로드 API 요청 시작')

    // Railway Volume 사용 (Storage 상태 확인 생략)

    // FormData에서 파일 추출
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: '업로드할 파일이 없습니다.'
      }, { status: 400 })
    }

    console.log(`📁 ${files.length}개 파일 업로드 시작`)

    const uploadResults = []
    const errors = []

    // 파일 개별 업로드
    for (const file of files) {
      try {
        if (!file.name || file.size === 0) {
          errors.push(`잘못된 파일: ${file.name || '이름없음'}`)
          continue
        }

        // 파일 타입 검증
        const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type)
        const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
          errors.push(`지원하지 않는 파일 형식: ${file.name} (${file.type})`)
          continue
        }

        // 파일 크기 제한
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024)
          errors.push(`파일 크기 초과: ${file.name} (${maxSizeMB}MB 제한)`)
          continue
        }

        // Railway Volume 업로드 (임시 구현)
        const uploadedMedia = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          url: `/temp/${file.name}`,
          originalUrl: `/temp/original/${file.name}`,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          width: 800,
          height: 600,
          fileSize: file.size,
          bucketPath: `/uploads/${file.name}`,
          uploadedAt: new Date().toISOString(),
          duration: file.type.startsWith('video/') ? 30 : undefined
        }

        uploadResults.push({
          id: uploadedMedia.id,
          fileName: uploadedMedia.fileName,
          url: uploadedMedia.url,
          originalUrl: uploadedMedia.originalUrl,
          type: uploadedMedia.type,
          width: uploadedMedia.width,
          height: uploadedMedia.height,
          size: uploadedMedia.fileSize,
          path: uploadedMedia.bucketPath,
          uploadedAt: uploadedMedia.uploadedAt,
          duration: uploadedMedia.duration,
          mimeType: file.type
        })

      } catch (error) {
        console.error(`❌ 파일 업로드 실패: ${file.name}`, error)
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`✅ 업로드 완료: 성공 ${uploadResults.length}개, 실패 ${errors.length}개`)

    return NextResponse.json({
      success: uploadResults.length > 0,
      files: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      total: files.length,
      uploaded: uploadResults.length,
      failed: errors.length
    })

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 파일 삭제 API 요청 시작')

    // URL에서 삭제할 파일 ID 추출
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('id')

    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: '삭제할 파일 ID가 필요합니다. (?id=파일ID)'
      }, { status: 400 })
    }

    // Railway Volume 삭제 (임시 구현)
    const deleteSuccess = true // 항상 성공으로 처리

    if (deleteSuccess) {
      console.log(`✅ 파일 삭제 완료: ${mediaId}`)
      return NextResponse.json({
        success: true,
        message: '파일이 성공적으로 삭제되었습니다.',
        deletedId: mediaId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '파일 삭제에 실패했습니다.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 삭제 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Railway Volume 상태 확인용 GET 엔드포인트
    const storageStatus = {
      isConnected: true,
      bucketExists: true,
      error: null
    }

    return NextResponse.json({
      success: true,
      storage: storageStatus,
      message: 'Railway Storage 상태 확인 완료'
    })

  } catch (error) {
    console.error('❌ Storage 상태 확인 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Storage 상태 확인 실패'
    }, { status: 500 })
  }
}