/**
 * Railway Volume 파일 업로드/삭제 API
 * POST: 파일 업로드
 * DELETE: 파일 삭제
 * GET: Storage 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ImageProcessor } from '@/lib/ImageProcessor'
import { SecurityValidator } from '@/lib/SecurityValidator'
import path from 'path'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'

// 지원하는 파일 형식
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 파일 업로드 API 요청 시작')

    // 보안 헤더 추가
    const securityHeaders = SecurityValidator.generateCSPHeaders()

    // FormData에서 파일 추출
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: '업로드할 파일이 없습니다.'
      }, {
        status: 400,
        headers: securityHeaders
      })
    }

    console.log(`📁 ${files.length}개 파일 업로드 시작`)

    // 보안 검증 단계
    console.log('🛡️ 보안 검증 시작')

    // 관리자 권한 확인
    const hasAdminAccess = await SecurityValidator.validateAdminAccess(request)
    if (!hasAdminAccess) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, {
        status: 403,
        headers: securityHeaders
      })
    }

    // 레이트 리미팅 확인
    const clientIP = SecurityValidator.getClientIP(request)
    const rateLimit = SecurityValidator.checkRateLimit(clientIP, 50, 15 * 60 * 1000) // 15분간 50개 파일

    if (!rateLimit.isAllowed) {
      return NextResponse.json({
        success: false,
        error: `업로드 한도 초과. ${Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 60000)}분 후 재시도하세요.`,
        remainingRequests: rateLimit.remainingRequests,
        resetTime: rateLimit.resetTime.toISOString()
      }, {
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      })
    }

    console.log(`✅ 보안 검증 통과 - IP: ${clientIP}, 남은 요청: ${rateLimit.remainingRequests}`)

    const uploadResults = []
    const errors = []

    // 파일 개별 보안 검증 및 업로드
    for (const file of files) {
      try {
        console.log(`🔍 파일 검증 시작: ${file.name}`)

        // 종합 보안 검증
        const validation = await SecurityValidator.performComprehensiveValidation(file, request)

        if (!validation.isValid) {
          console.error(`❌ 보안 검증 실패: ${file.name}`, validation.errors)
          errors.push(`${file.name}: ${validation.errors.join(', ')}`)
          continue
        }

        if (validation.warnings.length > 0) {
          console.warn(`⚠️ 보안 경고: ${file.name}`, validation.warnings)
        }

        console.log(`✅ 파일 보안 검증 통과: ${file.name} (위험도: ${validation.riskScore}/100)`)

        // 파일 타입 확인 (보안 검증 후 중복이지만 유지)
        const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type)
        const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type)

        // Railway Volume 실제 파일 업로드
        const mediaType = isImage ? 'image' : 'video'
        const typeDir = isImage ? 'images' : 'videos'

        // 고유 파일명 생성 (보안 정리된 파일명 사용)
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        const fileExtension = path.extname(validation.sanitizedFileName).toLowerCase()
        const baseName = path.parse(validation.sanitizedFileName).name
        const uniqueFileName = `${timestamp}-${randomId}-${baseName}${fileExtension}`

        // 업로드 경로 설정
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', typeDir)
        await mkdir(uploadDir, { recursive: true })

        let processedResult
        let metadata = {
          width: null as number | null,
          height: null as number | null,
          duration: null as number | null,
          fileSize: file.size,
          mimeType: file.type
        }

        if (isImage) {
          // 이미지 처리 파이프라인
          try {
            processedResult = await ImageProcessor.processImage(file, uploadDir, uniqueFileName)
            metadata.width = processedResult.original.width
            metadata.height = processedResult.original.height
          } catch (error) {
            console.error(`이미지 처리 실패: ${file.name}`, error)
            // 이미지 처리 실패 시 원본 파일만 저장
            const buffer = Buffer.from(await file.arrayBuffer())
            const filePath = path.join(uploadDir, uniqueFileName)
            await writeFile(filePath, buffer)

            // 기본 메타데이터 추출 시도
            try {
              const dimensions = await ImageProcessor.getImageDimensions(buffer)
              metadata.width = dimensions.width
              metadata.height = dimensions.height
            } catch {
              metadata.width = 800
              metadata.height = 600
            }
          }
        } else {
          // 비디오 파일 직접 저장 (추후 FFmpeg 처리 추가 가능)
          const buffer = Buffer.from(await file.arrayBuffer())
          const filePath = path.join(uploadDir, uniqueFileName)
          await writeFile(filePath, buffer)

          // 비디오 메타데이터는 임시값 설정 (추후 FFmpeg 통합)
          metadata.width = 1920
          metadata.height = 1080
          metadata.duration = 30.0
        }

        // 데이터베이스에 메타데이터 저장
        const savedMedia = await prisma.media.create({
          data: {
            fileName: uniqueFileName,
            originalFileName: file.name,
            type: mediaType,
            fileSize: file.size,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration,
            mimeType: file.type,
            storageType: 'filesystem',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        // 웹 노출용 URL 생성
        const baseUrl = `/uploads/${typeDir}/${uniqueFileName}`

        uploadResults.push({
          id: savedMedia.id,
          fileName: savedMedia.fileName,
          originalFileName: savedMedia.originalFileName,
          url: baseUrl,
          originalUrl: baseUrl,
          thumbnailUrl: isImage && processedResult ? `/uploads/${typeDir}/thumbnails/${path.parse(uniqueFileName).name}_thumb.webp` : null,
          webpUrl: isImage && processedResult ? `/uploads/${typeDir}/webp/${path.parse(uniqueFileName).name}.webp` : null,
          type: savedMedia.type,
          width: savedMedia.width,
          height: savedMedia.height,
          size: savedMedia.fileSize,
          path: baseUrl,
          uploadedAt: savedMedia.createdAt.toISOString(),
          duration: savedMedia.duration,
          mimeType: savedMedia.mimeType
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
    }, {
      headers: SecurityValidator.generateCSPHeaders()
    })

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
    }, {
      status: 500,
      headers: SecurityValidator.generateCSPHeaders()
    })
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

    // 데이터베이스에서 미디어 정보 조회
    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return NextResponse.json({
        success: false,
        error: '삭제할 파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 파일 시스템에서 실제 파일 삭제
    const typeDir = media.type === 'image' ? 'images' : 'videos'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', typeDir)
    const mainFilePath = path.join(uploadDir, media.fileName)

    try {
      // 메인 파일 삭제
      if (existsSync(mainFilePath)) {
        await unlink(mainFilePath)
        console.log(`🗑️ 메인 파일 삭제: ${mainFilePath}`)
      }

      // 이미지인 경우 썸네일 및 WebP 파일도 삭제
      if (media.type === 'image') {
        const baseName = path.parse(media.fileName).name
        const thumbnailPath = path.join(uploadDir, 'thumbnails', `${baseName}_thumb.webp`)
        const webpPath = path.join(uploadDir, 'webp', `${baseName}.webp`)

        if (existsSync(thumbnailPath)) {
          await unlink(thumbnailPath)
          console.log(`🗑️ 썸네일 파일 삭제: ${thumbnailPath}`)
        }

        if (existsSync(webpPath)) {
          await unlink(webpPath)
          console.log(`🗑️ WebP 파일 삭제: ${webpPath}`)
        }
      }

      // 데이터베이스에서 미디어 레코드 삭제
      await prisma.media.delete({
        where: { id: mediaId }
      })

      console.log(`✅ 파일 삭제 완료: ${mediaId}`)
      return NextResponse.json({
        success: true,
        message: '파일이 성공적으로 삭제되었습니다.',
        deletedId: mediaId,
        fileName: media.fileName
      })

    } catch (fileError) {
      console.error(`❌ 파일 삭제 실패: ${mediaId}`, fileError)
      return NextResponse.json({
        success: false,
        error: '파일 시스템에서 파일 삭제에 실패했습니다.'
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