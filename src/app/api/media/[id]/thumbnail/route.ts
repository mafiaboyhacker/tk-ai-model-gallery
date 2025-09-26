/**
 * 썸네일 전용 API 엔드포인트 - Phase 3 구현
 * 하이브리드 스토리지에서 썸네일을 서빙하는 전용 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error']
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id

    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: 'Media ID required'
      }, { status: 400 })
    }

    console.log(`🖼️ 썸네일 서빙 요청: ${mediaId}`)

    // PostgreSQL에서 썸네일 데이터 조회
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        fileName: true,
        type: true,
        thumbnailData: true,
        mimeType: true,
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

    // 🖼️ 썸네일 데이터가 있는 경우 (Base64에서 디코딩)
    if (media.thumbnailData) {
      console.log(`🖼️ DB 썸네일 서빙: ${media.fileName}`)

      try {
        const buffer = Buffer.from(media.thumbnailData, 'base64')
        console.log(`✅ 썸네일 디코딩 완료: ${(buffer.length / 1024).toFixed(1)}KB`)

        return new Response(buffer, {
          headers: {
            'Content-Type': 'image/jpeg', // 썸네일은 항상 JPEG
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=2592000, immutable, stale-while-revalidate=86400', // 30일 캐시
            'ETag': `"thumb-${media.id}-${media.uploadedAt?.getTime()}"`,
            'Last-Modified': media.uploadedAt?.toUTCString() || new Date().toUTCString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Thumbnail-Type': 'optimized',
            'Accept-Ranges': 'bytes',
            'Cross-Origin-Resource-Policy': 'cross-origin'
          }
        })
      } catch (decodeError) {
        console.error(`❌ 썸네일 디코딩 실패: ${mediaId}`, decodeError)
        return NextResponse.json({
          success: false,
          error: 'Failed to decode thumbnail data'
        }, { status: 500 })
      }
    }

    // 📁 썸네일이 없는 경우 원본으로 리다이렉트
    console.log(`⏭️ 썸네일 없음, 원본으로 리다이렉트: ${mediaId}`)

    return NextResponse.redirect(
      new URL(`/api/media/${mediaId}`, request.url),
      { status: 302 }
    )

  } catch (error) {
    console.error('❌ 썸네일 서빙 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * HEAD 요청 - 썸네일 존재 여부 확인
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        thumbnailData: true,
        uploadedAt: true
      }
    })

    if (!media || !media.thumbnailData) {
      return new Response(null, { status: 404 })
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000, immutable',
        'ETag': `"thumb-${media.id}-${media.uploadedAt?.getTime()}"`,
        'Last-Modified': media.uploadedAt?.toUTCString() || new Date().toUTCString()
      }
    })
  } catch (error) {
    return new Response(null, { status: 500 })
  }
}