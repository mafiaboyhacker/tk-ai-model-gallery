/**
 * Railway Volume 파일 서빙 API
 * /api/railway/storage/file/image/filename.jpg
 * /api/railway/storage/file/video/filename.mp4
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Railway Volume 경로 또는 로컬 경로 사용
const UPLOADS_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
  : path.join(process.cwd(), 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params

    // 타입 검증
    if (!['image', 'video'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type'
      }, { status: 400 })
    }

    // 파일 경로 구성 (Storage API와 동일한 구조)
    const typeDir = type === 'image' ? 'images' : 'videos'
    const filePath = path.join(UPLOADS_DIR, typeDir, filename)

    console.log(`🔍 파일 서빙 요청: ${type}/${filename}`)
    console.log(`📁 UPLOADS_DIR: ${UPLOADS_DIR}`)
    console.log(`📁 파일 경로: ${filePath}`)
    console.log(`🌍 RAILWAY_VOLUME_MOUNT_PATH: ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`)
    console.log(`📂 파일 존재 여부: ${existsSync(filePath)}`)

    // 디렉토리 구조 확인
    try {
      const { readdirSync } = require('fs')
      if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        console.log(`📋 Volume 루트 디렉토리:`, readdirSync(process.env.RAILWAY_VOLUME_MOUNT_PATH))
        const uploadsPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
        if (existsSync(uploadsPath)) {
          console.log(`📋 uploads 디렉토리:`, readdirSync(uploadsPath))
          const imagesPath = path.join(uploadsPath, 'images')
          if (existsSync(imagesPath)) {
            console.log(`📋 images 디렉토리:`, readdirSync(imagesPath))
          }
        }
      }
    } catch (err) {
      console.log(`❌ 디렉토리 구조 확인 실패:`, err)
    }

    // 🚀 Railway Volume 경로 시스템 강화 - 모든 가능한 경로를 순차적으로 확인
    const possiblePaths = [
      filePath, // 기본 Railway Volume 경로
      path.join('/app/uploads', typeDir, filename), // 컨테이너 기본 경로
      path.join(process.cwd(), 'uploads', typeDir, filename), // 현재 작업 디렉토리
      path.join('/data/uploads', typeDir, filename), // 추가 Volume 경로
      path.join('/railway/uploads', typeDir, filename), // Railway 전용 경로
      path.join('/opt/railway/uploads', typeDir, filename), // Railway 시스템 경로
      path.join('/tmp/uploads', typeDir, filename), // 임시 파일 경로 (fallback)
      path.join('/var/uploads', typeDir, filename), // 시스템 변수 경로
    ]

    let finalFilePath: string | null = null

    for (const testPath of possiblePaths) {
      console.log(`🔍 경로 확인: ${testPath}`)
      if (existsSync(testPath)) {
        finalFilePath = testPath
        console.log(`✅ 파일 발견: ${testPath}`)
        break
      }
    }

    if (!finalFilePath) {
      console.log(`❌ 파일 없음 - 모든 경로 확인 완료:`)
      possiblePaths.forEach((testPath, index) => {
        console.log(`   ${index + 1}. ${testPath}`)
      })

      // 🚨 파일을 찾지 못한 경우 상세 디버깅 정보와 함께 404 반환
      console.error(`❌ 파일 찾기 실패: ${type}/${filename}`)
      console.error(`📁 RAILWAY_VOLUME_MOUNT_PATH: ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`)
      console.error(`📁 UPLOADS_DIR: ${UPLOADS_DIR}`)
      console.error(`📁 최종 파일 경로 시도: ${filePath}`)

      return NextResponse.json({
        success: false,
        error: 'File not found in any location',
        searchedPaths: possiblePaths,
        debugInfo: {
          type,
          filename,
          typeDir,
          uploadsDir: UPLOADS_DIR,
          volumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH,
          workingDir: process.cwd()
        }
      }, { status: 404 })
    }

    console.log(`✅ 최종 파일 경로: ${finalFilePath}`)

    // 파일 읽기
    const fileBuffer = await readFile(finalFilePath)

    // MIME 타입 결정
    const extension = path.extname(filename).toLowerCase()
    let mimeType = 'application/octet-stream'

    switch (extension) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg'
        break
      case '.png':
        mimeType = 'image/png'
        break
      case '.webp':
        mimeType = 'image/webp'
        break
      case '.gif':
        mimeType = 'image/gif'
        break
      case '.mp4':
        mimeType = 'video/mp4'
        break
      case '.webm':
        mimeType = 'video/webm'
        break
      case '.mov':
        mimeType = 'video/quicktime'
        break
    }

    // 응답 생성 (Buffer를 Uint8Array로 변환)
    const response = new NextResponse(new Uint8Array(fileBuffer))
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Cache-Control', 'public, max-age=3600')
    response.headers.set('Content-Length', fileBuffer.length.toString())

    return response
  } catch (error) {
    console.error('❌ Railway 파일 서빙 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to serve file'
    }, { status: 500 })
  }
}