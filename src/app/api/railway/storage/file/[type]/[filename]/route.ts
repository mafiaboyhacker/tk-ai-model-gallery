/**
 * Railway Volume 파일 서빙 API
 * /api/railway/storage/file/image/filename.jpg
 * /api/railway/storage/file/video/filename.mp4
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 🚀 Railway Volume 경로 설정 (업로드 API와 완전 동일)
function getRailwayPaths() {
  const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' ||
                    process.env.RAILWAY_VOLUME_MOUNT_PATH

  if (isRailway) {
    // Railway 환경: Volume 루트 직접 사용
    const volumeRoot = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data'
    return {
      UPLOADS_DIR: volumeRoot,
      IMAGES_DIR: path.join(volumeRoot, 'images'),
      VIDEOS_DIR: path.join(volumeRoot, 'videos'),
      isRailway: true
    }
  } else {
    // 로컬 환경: 기존 구조 유지
    const uploadsDir = path.join(process.cwd(), 'uploads')
    return {
      UPLOADS_DIR: uploadsDir,
      IMAGES_DIR: path.join(uploadsDir, 'images'),
      VIDEOS_DIR: path.join(uploadsDir, 'videos'),
      isRailway: false
    }
  }
}

const { UPLOADS_DIR, IMAGES_DIR, VIDEOS_DIR, isRailway } = getRailwayPaths()

console.log('🔧 파일 서빙 Railway 경로 설정:', {
  isRailway,
  UPLOADS_DIR,
  IMAGES_DIR,
  VIDEOS_DIR,
  RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
})

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

    // 파일 경로 구성 (Storage API와 완전 동일한 구조)
    const typeDir = type === 'image' ? 'images' : 'videos'
    const targetDir = type === 'image' ? IMAGES_DIR : VIDEOS_DIR
    const filePath = path.join(targetDir, filename)

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

    // 🎯 정확한 파일 경로 확인 (업로드 API와 동일한 로직)
    console.log(`🔍 파일 경로 확인: ${filePath}`)
    console.log(`📂 파일 존재 여부: ${existsSync(filePath)}`)

    if (!existsSync(filePath)) {
      // 🔍 추가 디버깅 정보
      console.error(`❌ 파일 찾기 실패: ${type}/${filename}`)
      console.error(`📁 타겟 디렉토리: ${targetDir}`)
      console.error(`📁 파일 경로: ${filePath}`)
      console.error(`🌍 Railway 환경: ${isRailway}`)
      console.error(`📁 RAILWAY_VOLUME_MOUNT_PATH: ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`)

      // 디렉토리 내용 확인
      if (existsSync(targetDir)) {
        try {
          const { readdirSync } = require('fs')
          const files = readdirSync(targetDir)
          console.error(`📋 ${typeDir} 디렉토리 내용 (${files.length}개):`, files)
        } catch (err) {
          console.error(`❌ 디렉토리 읽기 실패:`, err)
        }
      } else {
        console.error(`❌ 타겟 디렉토리가 존재하지 않음: ${targetDir}`)
      }

      return NextResponse.json({
        success: false,
        error: 'File not found',
        debugInfo: {
          type,
          filename,
          filePath,
          targetDir,
          isRailway,
          volumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH,
          directoryExists: existsSync(targetDir)
        }
      }, { status: 404 })
    }

    console.log(`✅ 파일 발견: ${filePath}`)

    // 파일 읽기
    const fileBuffer = await readFile(filePath)

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