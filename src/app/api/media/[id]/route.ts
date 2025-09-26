/**
 * API 기반 파일 서빙 시스템 - Phase 3 구현
 * 하이브리드 스토리지에서 파일을 서빙하는 통합 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { getStoragePath } from '@/lib/hybridStorage'

const prisma = new PrismaClient({
  log: ['error']
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now() // 🚀 성능 측정 시작

  try {
    const { id: mediaId } = await params

    if (!mediaId) {
      console.error('❌ Media ID가 없음')
      return NextResponse.json({
        success: false,
        error: 'Media ID required'
      }, { status: 400 })
    }

    console.log(`🔍 파일 서빙 요청: ${mediaId}`)
    console.log(`🔍 요청 URL: ${request.url}`)

    // PostgreSQL에서 미디어 정보 조회
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        type: true,
        fileSize: true,
        storageType: true,
        fileData: true,
        thumbnailData: true,
        uploadedAt: true
      }
    })

    if (!media) {
      console.log(`❌ 미디어 찾을 수 없음: ${mediaId}`)
      return NextResponse.json({
        success: false,
        error: 'Media not found'
      }, { status: 404 })
    }

    console.log(`📊 미디어 정보: ${media.fileName} (${media.storageType})`)

    // 🗃️ 데이터베이스 저장된 파일 서빙 (Base64 디코딩)
    if (media.storageType === 'database' && media.fileData) {
      console.log(`🗃️ DB에서 서빙: ${media.fileName}`)

      try {
        const buffer = Buffer.from(media.fileData, 'base64')
        const responseTime = Date.now() - startTime // 🚀 응답 시간 계산
        console.log(`✅ Base64 디코딩 완료: ${(buffer.length / 1024).toFixed(1)}KB (${responseTime}ms)`)

        return new Response(buffer, {
          headers: {
            'Content-Type': media.mimeType || 'application/octet-stream',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
            'ETag': `"${media.id}-${media.uploadedAt?.getTime()}"`,
            'Last-Modified': media.uploadedAt?.toUTCString() || new Date().toUTCString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Storage-Type': 'database',
            'X-Response-Time': `${responseTime}ms`,
            'X-File-Size': `${(buffer.length / 1024).toFixed(1)}KB`,
            'Accept-Ranges': 'bytes',
            'Cross-Origin-Resource-Policy': 'cross-origin'
          }
        })
      } catch (decodeError) {
        console.error(`❌ Base64 디코딩 실패: ${mediaId}`, decodeError)
        return NextResponse.json({
          success: false,
          error: 'Failed to decode file data'
        }, { status: 500 })
      }
    }

    // 💽 파일시스템에서 서빙
    if (media.storageType === 'filesystem' || !media.fileData) {
      console.log(`💽 파일시스템에서 서빙: ${media.fileName}`)

      const storage = getStoragePath()
      const isVideo = media.type === 'video'
      const targetDir = isVideo ? storage.videosDir : storage.imagesDir
      const filePath = path.join(targetDir, media.fileName)

      console.log(`📁 파일 경로: ${filePath}`)
      console.log(`🔍 스토리지 타입: ${storage.storageType}`)

      if (!existsSync(filePath)) {
        console.log(`❌ 파일 없음: ${filePath}`)
        return NextResponse.json({
          success: false,
          error: 'File not found in filesystem'
        }, { status: 404 })
      }

      try {
        const fileBuffer = await readFile(filePath)
        const responseTime = Date.now() - startTime // 🚀 응답 시간 계산
        console.log(`✅ 파일 로드 완료: ${(fileBuffer.length / 1024).toFixed(1)}KB (${responseTime}ms)`)

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': media.mimeType || 'application/octet-stream',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
            'ETag': `"${media.id}-${media.uploadedAt?.getTime()}"`,
            'Last-Modified': media.uploadedAt?.toUTCString() || new Date().toUTCString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Storage-Type': 'filesystem',
            'X-Response-Time': `${responseTime}ms`,
            'X-File-Size': `${(fileBuffer.length / 1024).toFixed(1)}KB`,
            'Accept-Ranges': 'bytes',
            'Cross-Origin-Resource-Policy': 'cross-origin'
          }
        })
      } catch (fileError) {
        console.error(`❌ 파일 읽기 실패: ${filePath}`, fileError)
        return NextResponse.json({
          success: false,
          error: 'Failed to read file'
        }, { status: 500 })
      }
    }

    // 🚨 예상치 못한 상태
    console.error(`❌ 예상치 못한 스토리지 상태: ${mediaId}`, {
      storageType: media.storageType,
      hasFileData: !!media.fileData,
      fileName: media.fileName
    })

    return NextResponse.json({
      success: false,
      error: 'Invalid storage configuration'
    }, { status: 500 })

  } catch (error) {
    console.error('❌ 파일 서빙 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 썸네일 서빙 엔드포인트 (선택사항)
 * /api/media/[id]/thumbnail 경로로 접근 시
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // HEAD 요청은 헤더만 반환 (파일 존재 여부 확인용)
  try {
    const { id: mediaId } = await params
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, storageType: true, fileData: true, uploadedAt: true }
    })

    if (!media) {
      return new Response(null, { status: 404 })
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${media.id}-${media.uploadedAt?.getTime()}"`,
        'Last-Modified': media.uploadedAt?.toUTCString() || new Date().toUTCString()
      }
    })
  } catch (error) {
    return new Response(null, { status: 500 })
  }
}