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

    // 첫 번째 경로에서 파일 존재 확인
    let finalFilePath = filePath
    if (!existsSync(filePath)) {
      // 이전 배포의 경로도 확인 (/app/uploads/)
      const legacyPath = path.join('/app/uploads', typeDir, filename)
      console.log(`🔍 레거시 경로 확인: ${legacyPath}`)

      if (existsSync(legacyPath)) {
        finalFilePath = legacyPath
        console.log(`✅ 레거시 경로에서 파일 발견: ${legacyPath}`)
      } else {
        // 업로드 API가 실제로 사용하는 경로 확인 (현재 작업 디렉토리 기준)
        const currentWorkingPath = path.join(process.cwd(), 'uploads', typeDir, filename)
        console.log(`🔍 현재 작업 디렉토리 경로 확인: ${currentWorkingPath}`)

        if (existsSync(currentWorkingPath)) {
          finalFilePath = currentWorkingPath
          console.log(`✅ 현재 작업 디렉토리에서 파일 발견: ${currentWorkingPath}`)
        } else {
          console.log(`❌ 파일 없음 - 모든 경로 확인함:`)
          console.log(`   - Volume 경로: ${filePath}`)
          console.log(`   - 레거시 경로: ${legacyPath}`)
          console.log(`   - 작업 디렉토리 경로: ${currentWorkingPath}`)
          return NextResponse.json({
            success: false,
            error: 'File not found'
          }, { status: 404 })
        }
      }
    } else {
      console.log(`✅ Volume 경로에서 파일 발견: ${filePath}`)
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