/**
 * Railway 디버깅 API
 * Railway Volume 상태와 파일 시스템 구조를 확인하는 디버깅 도구
 */

import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Railway 디버깅 API 시작')

    const debug = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
        PWD: process.cwd(),
        platform: process.platform,
        arch: process.arch
      },
      paths: {
        workingDirectory: process.cwd(),
        volumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH || 'not-set',
        uploadsPath: null as any,
        imagesPath: null as any,
        videosPath: null as any
      },
      directories: {
        volumeRoot: null as any,
        uploads: null as any,
        images: null as any,
        videos: null as any
      },
      files: {
        totalImages: 0,
        totalVideos: 0,
        recentImages: [] as any[],
        recentVideos: [] as any[]
      }
    }

    // 경로 설정 (업로드 API와 동일한 로직)
    const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' ||
                      process.env.RAILWAY_VOLUME_MOUNT_PATH

    if (isRailway) {
      const volumeRoot = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data'
      debug.paths.uploadsPath = volumeRoot
      debug.paths.imagesPath = path.join(volumeRoot, 'images')
      debug.paths.videosPath = path.join(volumeRoot, 'videos')
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      debug.paths.uploadsPath = uploadsDir
      debug.paths.imagesPath = path.join(uploadsDir, 'images')
      debug.paths.videosPath = path.join(uploadsDir, 'videos')
    }

    // Volume 루트 디렉토리 확인
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH && existsSync(process.env.RAILWAY_VOLUME_MOUNT_PATH)) {
      try {
        const volumeContents = await readdir(process.env.RAILWAY_VOLUME_MOUNT_PATH)
        debug.directories.volumeRoot = {
          exists: true,
          contents: volumeContents,
          count: volumeContents.length
        }
      } catch (error) {
        debug.directories.volumeRoot = { exists: true, error: String(error) }
      }
    } else {
      debug.directories.volumeRoot = { exists: false }
    }

    // uploads 디렉토리 확인
    if (existsSync(debug.paths.uploadsPath)) {
      try {
        const uploadsContents = await readdir(debug.paths.uploadsPath)
        debug.directories.uploads = {
          exists: true,
          path: debug.paths.uploadsPath,
          contents: uploadsContents,
          count: uploadsContents.length
        }
      } catch (error) {
        debug.directories.uploads = { exists: true, path: debug.paths.uploadsPath, error: String(error) }
      }
    } else {
      debug.directories.uploads = { exists: false, path: debug.paths.uploadsPath }
    }

    // images 디렉토리 확인
    if (existsSync(debug.paths.imagesPath)) {
      try {
        const imageFiles = await readdir(debug.paths.imagesPath)
        debug.directories.images = {
          exists: true,
          path: debug.paths.imagesPath,
          contents: imageFiles,
          count: imageFiles.length
        }
        debug.files.totalImages = imageFiles.length

        // 최근 이미지 5개
        const recentImages = imageFiles
          .slice(0, 5)
          .map(filename => ({
            filename,
            path: path.join(debug.paths.imagesPath, filename),
            url: `/api/railway/storage/file/image/${filename}`
          }))
        debug.files.recentImages = recentImages

      } catch (error) {
        debug.directories.images = { exists: true, path: debug.paths.imagesPath, error: String(error) }
      }
    } else {
      debug.directories.images = { exists: false, path: debug.paths.imagesPath }
    }

    // videos 디렉토리 확인
    if (existsSync(debug.paths.videosPath)) {
      try {
        const videoFiles = await readdir(debug.paths.videosPath)
        debug.directories.videos = {
          exists: true,
          path: debug.paths.videosPath,
          contents: videoFiles,
          count: videoFiles.length
        }
        debug.files.totalVideos = videoFiles.length

        // 최근 비디오 5개
        const recentVideos = videoFiles
          .slice(0, 5)
          .map(filename => ({
            filename,
            path: path.join(debug.paths.videosPath, filename),
            url: `/api/railway/storage/file/video/${filename}`
          }))
        debug.files.recentVideos = recentVideos

      } catch (error) {
        debug.directories.videos = { exists: true, path: debug.paths.videosPath, error: String(error) }
      }
    } else {
      debug.directories.videos = { exists: false, path: debug.paths.videosPath }
    }

    console.log('✅ Railway 디버깅 완료:', debug)

    return NextResponse.json({
      success: true,
      debug,
      summary: {
        isRailway,
        volumeMounted: !!process.env.RAILWAY_VOLUME_MOUNT_PATH,
        totalFiles: debug.files.totalImages + debug.files.totalVideos,
        imagesCount: debug.files.totalImages,
        videosCount: debug.files.totalVideos
      }
    })

  } catch (error) {
    console.error('❌ Railway 디버깅 오류:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}