/**
 * Railway Volume Storage API Routes
 * Railway 디스크 볼륨을 사용한 파일 저장 시스템
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readdir, unlink, mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Railway Volume 디렉토리 설정 (지속적 저장)
// 🚀 Railway Volume Mount Path가 이미 uploads를 포함할 수 있으므로 중복 방지
const UPLOADS_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'uploads')
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images')
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos')

// 업로드 디렉토리 초기화
async function ensureUploadDirs() {
  try {
    console.log(`🔍 디렉토리 초기화 시작:`)
    console.log(`📁 UPLOADS_DIR: ${UPLOADS_DIR}`)
    console.log(`📁 IMAGES_DIR: ${IMAGES_DIR}`)
    console.log(`📁 VIDEOS_DIR: ${VIDEOS_DIR}`)
    console.log(`🌍 RAILWAY_VOLUME_MOUNT_PATH: ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`)

    if (!existsSync(UPLOADS_DIR)) {
      console.log(`📁 UPLOADS_DIR 생성 중: ${UPLOADS_DIR}`)
      await mkdir(UPLOADS_DIR, { recursive: true })
      console.log(`✅ UPLOADS_DIR 생성 완료: ${UPLOADS_DIR}`)
    } else {
      console.log(`✅ UPLOADS_DIR 이미 존재: ${UPLOADS_DIR}`)
    }

    if (!existsSync(IMAGES_DIR)) {
      console.log(`📁 IMAGES_DIR 생성 중: ${IMAGES_DIR}`)
      await mkdir(IMAGES_DIR, { recursive: true })
      console.log(`✅ IMAGES_DIR 생성 완료: ${IMAGES_DIR}`)
    } else {
      console.log(`✅ IMAGES_DIR 이미 존재: ${IMAGES_DIR}`)
    }

    if (!existsSync(VIDEOS_DIR)) {
      console.log(`📁 VIDEOS_DIR 생성 중: ${VIDEOS_DIR}`)
      await mkdir(VIDEOS_DIR, { recursive: true })
      console.log(`✅ VIDEOS_DIR 생성 완료: ${VIDEOS_DIR}`)
    } else {
      console.log(`✅ VIDEOS_DIR 이미 존재: ${VIDEOS_DIR}`)
    }

    // 디렉토리 구조 최종 확인
    console.log(`📋 최종 디렉토리 구조 확인:`)
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
      const { readdirSync } = require('fs')
      console.log(`📋 Volume 루트:`, readdirSync(process.env.RAILWAY_VOLUME_MOUNT_PATH))
      if (existsSync(UPLOADS_DIR)) {
        console.log(`📋 uploads:`, readdirSync(UPLOADS_DIR))
      }
    }
  } catch (error) {
    console.error('❌ 디렉토리 생성 실패:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    await ensureUploadDirs()

    switch (action) {
      case 'list':
        // PostgreSQL에서 미디어 목록 조회
        const mediaList = await prisma.media.findMany({
          orderBy: { uploadedAt: 'desc' }
        })

        // Railway Volume에서 실제 파일 존재 여부 확인
        const validMedia = []
        for (const media of mediaList) {
          const filePath = path.join(
            media.type === 'video' ? VIDEOS_DIR : IMAGES_DIR,
            media.fileName
          )

          if (existsSync(filePath)) {
            validMedia.push({
              ...media,
              url: `/api/railway/storage/file/${media.type}/${media.fileName}`,
              originalUrl: `/api/railway/storage/file/${media.type}/${media.fileName}`
            })
          }
        }

        return NextResponse.json({
          success: true,
          data: validMedia,
          count: validMedia.length
        })

      case 'init':
        // Railway Volume 초기화
        await ensureUploadDirs()

        return NextResponse.json({
          success: true,
          message: 'Railway Volume initialized successfully'
        })

      case 'debug':
        // 파일 시스템 상세 디버그 정보
        await ensureUploadDirs()

        try {
          const uploadsExists = existsSync(UPLOADS_DIR)
          const imagesExists = existsSync(IMAGES_DIR)
          const videosExists = existsSync(VIDEOS_DIR)

          let uploadsFiles: string[] = []
          let imagesFiles: string[] = []
          let videosFiles: string[] = []

          if (uploadsExists) {
            uploadsFiles = await readdir(UPLOADS_DIR)
          }
          if (imagesExists) {
            imagesFiles = await readdir(IMAGES_DIR)
          }
          if (videosExists) {
            videosFiles = await readdir(VIDEOS_DIR)
          }

          // 각 파일의 상세 정보 조회
          const imagesDetail = []
          for (const file of imagesFiles) {
            try {
              const filePath = path.join(IMAGES_DIR, file)
              const stats = await stat(filePath)
              imagesDetail.push({
                name: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
              })
            } catch (e) {
              imagesDetail.push({ name: file, error: 'Cannot read stats' })
            }
          }

          const videosDetail = []
          for (const file of videosFiles) {
            try {
              const filePath = path.join(VIDEOS_DIR, file)
              const stats = await stat(filePath)
              videosDetail.push({
                name: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
              })
            } catch (e) {
              videosDetail.push({ name: file, error: 'Cannot read stats' })
            }
          }

          return NextResponse.json({
            success: true,
            debug: {
              directories: {
                uploads: { path: UPLOADS_DIR, exists: uploadsExists },
                images: { path: IMAGES_DIR, exists: imagesExists },
                videos: { path: VIDEOS_DIR, exists: videosExists }
              },
              fileCounts: {
                uploads: uploadsFiles.length,
                images: imagesFiles.length,
                videos: videosFiles.length
              },
              files: {
                uploads: uploadsFiles,
                images: imagesDetail,
                videos: videosDetail
              },
              currentWorkingDir: process.cwd(),
              environment: {
                NODE_ENV: process.env.NODE_ENV,
                RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
              }
            }
          })
        } catch (debugError) {
          return NextResponse.json({
            success: false,
            error: 'Debug failed',
            details: debugError instanceof Error ? debugError.message : 'Unknown debug error'
          })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Railway Storage GET 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    await ensureUploadDirs()

    switch (action) {
      case 'upload':
        const formData = await request.formData()
        const file = formData.get('file') as File
        const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

        if (!file) {
          return NextResponse.json({
            success: false,
            error: 'No file provided'
          }, { status: 400 })
        }

        console.log(`🔄 Railway Upload: ${file.name} 시작`)

        const isVideo = file.type.startsWith('video/')
        const targetDir = isVideo ? VIDEOS_DIR : IMAGES_DIR

        // 고유 파일명 생성
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`
        const filePath = path.join(targetDir, uniqueFileName)

        // 파일을 Railway Volume에 저장
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await writeFile(filePath, buffer)

        console.log(`✅ Railway Volume 저장 성공: ${filePath}`)

        // 자동 번호 생성을 위한 기존 미디어 개수 조회
        const existingCount = await prisma.media.count({
          where: { type: isVideo ? 'video' : 'image' }
        })
        const autoNumber = existingCount + 1
        const autoTitle = isVideo ? `VIDEO #${autoNumber}` : `MODEL #${autoNumber}`

        // PostgreSQL에 메타데이터 저장
        const mediaRecord = await prisma.media.create({
          data: {
            id: uniqueFileName.split('.')[0],
            fileName: uniqueFileName,
            originalFileName: file.name,
            title: autoTitle,
            type: isVideo ? 'video' : 'image',
            fileSize: file.size,
            mimeType: file.type,
            width: metadata.width || (isVideo ? 1920 : 800),
            height: metadata.height || (isVideo ? 1080 : 600),
            duration: isVideo ? metadata.duration : null,
            resolution: isVideo ? metadata.resolution || '1920x1080' : null,
            uploadedAt: new Date()
          }
        })

        console.log(`✅ PostgreSQL 메타데이터 저장: ${mediaRecord.id}`)

        return NextResponse.json({
          success: true,
          data: {
            ...mediaRecord,
            url: `/api/railway/storage/file/${mediaRecord.type}/${mediaRecord.fileName}`,
            originalUrl: `/api/railway/storage/file/${mediaRecord.type}/${mediaRecord.fileName}`
          }
        })


      case 'bulk-upload':
        const bulkFormData = await request.formData()
        const files = bulkFormData.getAll('files') as File[]
        const bulkResults = []

        if (!files || files.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No files provided'
          }, { status: 400 })
        }

        console.log(`🔄 Railway Bulk Upload: ${files.length}개 파일 시작`)

        // 순차적으로 파일 업로드 (서버 부하 방지)
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          try {
            const isVideo = file.type.startsWith('video/')
            const targetDir = isVideo ? VIDEOS_DIR : IMAGES_DIR

            // 고유 파일명 생성
            const timestamp = Date.now() + i // 충돌 방지
            const randomId = Math.random().toString(36).substring(2, 8)
            const fileExtension = file.name.split('.').pop()
            const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`
            const filePath = path.join(targetDir, uniqueFileName)

            // 파일 저장
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            await writeFile(filePath, buffer)

            // 자동 번호 생성
            const existingCount = await prisma.media.count({
              where: { type: isVideo ? 'video' : 'image' }
            })
            const autoNumber = existingCount + 1
            const autoTitle = isVideo ? `VIDEO #${autoNumber}` : `MODEL #${autoNumber}`

            // PostgreSQL에 메타데이터 저장
            const mediaRecord = await prisma.media.create({
              data: {
                id: uniqueFileName.split('.')[0],
                fileName: uniqueFileName,
                originalFileName: file.name,
                title: autoTitle,
                type: isVideo ? 'video' : 'image',
                fileSize: file.size,
                mimeType: file.type,
                width: isVideo ? 1920 : 800,
                height: isVideo ? 1080 : 600,
                duration: isVideo ? null : null,
                resolution: isVideo ? '1920x1080' : null,
                uploadedAt: new Date()
              }
            })

            bulkResults.push({
              success: true,
              file: file.name,
              data: {
                ...mediaRecord,
                url: `/api/railway/storage/file/${mediaRecord.type}/${mediaRecord.fileName}`
              }
            })

            console.log(`✅ Bulk Upload ${i + 1}/${files.length}: ${file.name}`)

            // 서버 부하 방지를 위한 지연
            if (i < files.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }

          } catch (fileError) {
            console.error(`❌ Bulk Upload 실패 ${file.name}:`, fileError)
            const errorMessage = fileError instanceof Error ? fileError.message : 'Upload failed'
            bulkResults.push({
              success: false,
              file: file.name,
              error: errorMessage
            })
          }
        }

        const successCount = bulkResults.filter(r => r.success).length
        const failedCount = bulkResults.length - successCount

        console.log(`✅ Bulk Upload 완료: ${successCount}성공, ${failedCount}실패`)

        return NextResponse.json({
          success: true,
          message: `Bulk upload completed: ${successCount} success, ${failedCount} failed`,
          results: bulkResults,
          summary: {
            total: files.length,
            success: successCount,
            failed: failedCount
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Railway Storage POST 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get('id')

  if (!mediaId) {
    return NextResponse.json({
      success: false,
      error: 'Media ID required'
    }, { status: 400 })
  }

  try {
    // PostgreSQL에서 미디어 정보 조회
    const media = await prisma.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return NextResponse.json({
        success: false,
        error: 'Media not found'
      }, { status: 404 })
    }

    // Railway Volume에서 파일 삭제
    const filePath = path.join(
      media.type === 'video' ? VIDEOS_DIR : IMAGES_DIR,
      media.fileName
    )

    if (existsSync(filePath)) {
      await unlink(filePath)
      console.log(`🗑️ Railway Volume 파일 삭제: ${filePath}`)
    }

    // PostgreSQL에서 메타데이터 삭제
    await prisma.media.delete({
      where: { id: mediaId }
    })

    console.log(`✅ Railway 미디어 삭제 완료: ${mediaId}`)

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })
  } catch (error) {
    console.error('❌ Railway Storage DELETE 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, title } = await request.json()

    if (!id || !title) {
      return NextResponse.json({
        success: false,
        error: 'ID and title are required'
      }, { status: 400 })
    }

    // PostgreSQL에서 타이틀 업데이트
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: { title }
    })

    console.log(`✅ Railway: 미디어 타이틀 업데이트: ${id} → ${title}`)

    return NextResponse.json({
      success: true,
      data: updatedMedia
    })

  } catch (error) {
    console.error('❌ Railway Storage PATCH 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}