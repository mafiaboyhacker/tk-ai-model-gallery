/**
 * Railway Volume 파일 서빙 API
 * 업로드된 미디어 파일을 최적화된 헤더와 함께 제공
 * Path: /api/uploads/{type}/{filename}
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { MediaOptimizer } from '@/lib/mediaOptimizer'

// MIME 타입 매핑
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
}

// 캐시 헤더 설정
const CACHE_MAX_AGE = 60 * 60 * 24 * 30 // 30일
const CACHE_STALE_WHILE_REVALIDATE = 60 * 60 * 24 * 7 // 7일

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path

    if (!pathSegments || pathSegments.length < 2) {
      return new NextResponse('잘못된 파일 경로', { status: 400 })
    }

    // 파일 경로 구성
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      ...pathSegments
    )

    // 보안: 경로 탐색 공격 방지
    if (!filePath.includes(path.join(process.cwd(), 'public', 'uploads'))) {
      return new NextResponse('접근 권한 없음', { status: 403 })
    }

    // 파일 존재 확인
    if (!existsSync(filePath)) {
      return new NextResponse('파일을 찾을 수 없음', { status: 404 })
    }

    // 파일 확장자로 MIME 타입 결정
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

    // 파일 통계 정보 조회
    const fileStats = await stat(filePath)
    const fileSize = fileStats.size

    // 파일 읽기
    const fileBuffer = await readFile(filePath)

    // MediaOptimizer를 사용한 최적화된 헤더 생성
    const optimization = MediaOptimizer.generateOptimizedHeaders(
      filePath,
      fileSize,
      request,
      {
        enableCDN: true,
        enableCompression: true,
        enableWebP: true,
        enableResponsiveImages: true,
        cacheMaxAge: CACHE_MAX_AGE,
        compressionQuality: MediaOptimizer.calculateDynamicQuality(request)
      }
    )

    // CDN 헤더 추가
    const optimizedHeaders = MediaOptimizer.addCDNHeaders(optimization.headers)

    // 최적화된 응답 헤더 설정
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': fileBuffer.length.toString(),
      'ETag': MediaOptimizer.generateETag(filePath, fileSize, fileStats.mtime, optimization.format),
      'Last-Modified': fileStats.mtime.toUTCString(),
      'Accept-Ranges': 'bytes',
      ...optimizedHeaders
    })

    // 비디오 스트리밍 헤더
    if (mimeType.startsWith('video/')) {
      headers.set('Accept-Ranges', 'bytes')

      // Range 요청 처리 (기본적인 구현)
      const range = request.headers.get('range')
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1
        const chunksize = (end - start) + 1
        const chunk = fileBuffer.slice(start, end + 1)

        headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`)
        headers.set('Content-Length', chunksize.toString())

        return new NextResponse(chunk, {
          status: 206, // Partial Content
          headers
        })
      }
    }

    // 성능 메트릭 수집
    const responseStartTime = Date.now()
    const responseTime = responseStartTime - (request as any)._startTime || 0

    const performanceMetrics = MediaOptimizer.collectPerformanceMetrics(
      request,
      responseTime,
      fileSize,
      fileBuffer.length
    )

    // 성능 헤더 추가
    headers.set('X-Response-Time', `${responseTime}ms`)
    headers.set('X-Compression-Ratio', `${performanceMetrics.compressionRatio}%`)
    headers.set('X-Bandwidth-Saved', `${performanceMetrics.bandwidthSaved}`)

    if (performanceMetrics.cacheHit) {
      headers.set('X-Cache-Status', 'HIT')
    }

    return new NextResponse(fileBuffer, { headers })

  } catch (error) {
    console.error('파일 서빙 오류:', error)
    return new NextResponse('파일 서빙 중 오류 발생', { status: 500 })
  }
}