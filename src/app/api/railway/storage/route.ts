/**
 * Railway Volume Storage API Routes
 * Railway 디스크 볼륨을 사용한 파일 저장 시스템
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readdir, unlink, mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { VideoProcessor } from '@/lib/videoProcessor'
import { ImageProcessor } from '@/lib/imageProcessor'

// 🚀 성능 최적화된 Prisma 클라이언트
const prisma = new PrismaClient({
  log: ['error'],
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
})

// Prisma 연결 풀 최적화 (Prisma 5.0+에서는 process 이벤트 사용)
process.on('beforeExit', async () => {
  console.log('🔌 Prisma 연결 정리 중...')
  await prisma.$disconnect()
})

// 🚀 인메모리 캐싱 시스템
interface CacheEntry {
  data: any
  timestamp: number
  count?: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5분
const COUNT_CACHE_TTL = 10 * 60 * 1000 // 10분 (카운트는 더 길게)

// 캐시 유틸리티 함수
function getCacheKey(action: string, params?: Record<string, any>) {
  return `${action}:${JSON.stringify(params || {})}`
}

function isValidCache(entry: CacheEntry, ttl: number = CACHE_TTL): boolean {
  return Date.now() - entry.timestamp < ttl
}

function setCache(key: string, data: any, count?: number) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    count
  })
  console.log(`💾 캐시 저장: ${key} (${cache.size}개 항목)`)
}

function getCache(key: string, ttl?: number): CacheEntry | null {
  const entry = cache.get(key)
  if (entry && isValidCache(entry, ttl)) {
    console.log(`⚡ 캐시 적중: ${key}`)
    return entry
  }
  if (entry) {
    cache.delete(key)
    console.log(`🗑️ 만료된 캐시 삭제: ${key}`)
  }
  return null
}

// 캐시 무효화 함수
function invalidateCache(pattern?: string) {
  if (pattern) {
    let deletedCount = 0
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key)
        deletedCount++
      }
    }
    console.log(`🧹 패턴 캐시 무효화: ${pattern} (${deletedCount}개 삭제)`)
  } else {
    const totalCount = cache.size
    cache.clear()
    console.log(`🧹 전체 캐시 무효화: ${totalCount}개 삭제`)
  }
}

// 🚀 성능 모니터링 함수
function logPerformanceMetrics(operation: string, startTime: number, additionalInfo?: Record<string, any>) {
  const endTime = Date.now()
  const duration = endTime - startTime

  console.log(`⚡ 성능 측정 [${operation}]:`, {
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    cacheSize: cache.size,
    ...additionalInfo
  })

  // 성능 경고 (500ms 이상)
  if (duration > 500) {
    console.warn(`⚠️ 느린 작업 감지: ${operation} (${duration}ms)`)
  }
}

// 🔄 DB-파일 동기화 함수 (핵심 기능)
async function syncMediaStorage() {
  console.log('🔄 DB-파일 동기화 시작...')
  const startTime = Date.now()

  try {
    // 1. DB의 모든 레코드 조회
    const dbRecords = await prisma.media.findMany()
    console.log(`📊 DB 레코드: ${dbRecords.length}개`)

    // 2. 파일 시스템의 모든 파일 조회
    const imageFiles = existsSync(IMAGES_DIR) ? await readdir(IMAGES_DIR) : []
    const videoFiles = existsSync(VIDEOS_DIR) ? await readdir(VIDEOS_DIR) : []
    console.log(`📁 파일 시스템: 이미지 ${imageFiles.length}개, 비디오 ${videoFiles.length}개`)

    let orphanedDbRecords = 0
    let orphanedFiles = 0
    let recoveredFiles = 0

    // 3. DB 레코드 검증 (파일이 실제로 존재하는지)
    for (const record of dbRecords) {
      const targetDir = record.type === 'video' ? VIDEOS_DIR : IMAGES_DIR
      const filePath = path.join(targetDir, record.fileName)

      if (!existsSync(filePath)) {
        console.log(`🗑️ 고아 DB 레코드 발견: ${record.fileName} (파일 없음)`)
        orphanedDbRecords++

        // 고아 레코드 삭제 여부는 옵션으로 처리
        // await prisma.media.delete({ where: { id: record.id } })
      }
    }

    // 4. 파일 시스템 검증 (DB 레코드가 있는지)
    const allFiles = [
      ...imageFiles.map(f => ({ file: f, type: 'image' as const })),
      ...videoFiles.map(f => ({ file: f, type: 'video' as const }))
    ]

    for (const { file, type } of allFiles) {
      const dbRecord = dbRecords.find(r => r.fileName === file)

      if (!dbRecord) {
        console.log(`📁 고아 파일 발견: ${file} (DB 레코드 없음)`)
        orphanedFiles++

        // 고아 파일에 대한 DB 레코드 자동 생성
        try {
          const targetDir = type === 'video' ? VIDEOS_DIR : IMAGES_DIR
          const filePath = path.join(targetDir, file)
          const fileStats = await stat(filePath)

          // 자동 번호 생성
          const existingCount = await prisma.media.count({ where: { type } })
          const autoNumber = existingCount + 1
          const autoTitle = type === 'video' ? `VIDEO #${autoNumber}` : `MODEL #${autoNumber}`

          await prisma.media.create({
            data: {
              id: file.split('.')[0],
              fileName: file,
              originalFileName: file,
              title: autoTitle,
              type,
              fileSize: fileStats.size,
              mimeType: type === 'video' ? 'video/mp4' : 'image/jpeg',
              width: type === 'video' ? 1920 : 800,
              height: type === 'video' ? 1080 : 600,
              duration: type === 'video' ? null : null,
              resolution: type === 'video' ? '1920x1080' : null,
              uploadedAt: fileStats.mtime
            }
          })

          recoveredFiles++
          console.log(`✅ 파일 복구 성공: ${file} → DB 레코드 생성`)
        } catch (recoveryError) {
          console.error(`❌ 파일 복구 실패: ${file}`, recoveryError)
        }
      }
    }

    logPerformanceMetrics('sync-media-storage', startTime, {
      dbRecords: dbRecords.length,
      imageFiles: imageFiles.length,
      videoFiles: videoFiles.length,
      orphanedDbRecords,
      orphanedFiles,
      recoveredFiles
    })

    return {
      success: true,
      stats: {
        dbRecords: dbRecords.length,
        fileSystemFiles: imageFiles.length + videoFiles.length,
        orphanedDbRecords,
        orphanedFiles,
        recoveredFiles
      }
    }
  } catch (error) {
    console.error('❌ DB-파일 동기화 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 🚀 Railway Volume 디렉토리 설정 (완전 개선)
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
    // 로컬 환경: public/uploads 구조 사용
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    return {
      UPLOADS_DIR: uploadsDir,
      IMAGES_DIR: path.join(uploadsDir, 'images'),
      VIDEOS_DIR: path.join(uploadsDir, 'videos'),
      isRailway: false
    }
  }
}

const { UPLOADS_DIR, IMAGES_DIR, VIDEOS_DIR, isRailway } = getRailwayPaths()

console.log('🔧 Railway 경로 설정:', {
  isRailway,
  UPLOADS_DIR,
  IMAGES_DIR,
  VIDEOS_DIR,
  RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
})

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
        const listStartTime = Date.now()

        // 🚀 캐시 확인
        const listCacheKey = getCacheKey('list', { unlimited: true })
        const cachedList = getCache(listCacheKey)

        if (cachedList) {
          console.log(`⚡ 캐시된 미디어 목록 반환: ${cachedList.count}개`)
          return NextResponse.json({
            success: true,
            data: cachedList.data,
            count: cachedList.count,
            cached: true
          })
        }

        let validMedia = []

        // 🚀 DB 연결 시도, 실패 시 즉시 파일시스템으로 전환
        try {
          console.log('🔍 PostgreSQL에서 미디어 목록 조회 시도...')

          // PostgreSQL에서 미디어 목록 조회
          const mediaList = await prisma.media.findMany({
            select: {
              id: true, fileName: true, originalFileName: true, title: true,
              type: true, fileSize: true, mimeType: true, width: true,
              height: true, duration: true, resolution: true, uploadedAt: true
            },
            orderBy: { uploadedAt: 'desc' }
          })

          console.log(`📊 PostgreSQL 조회 성공: ${mediaList.length}개`)

          // DB에서 가져온 데이터로 유효성 검사 및 URL 생성
          const validationPromises = mediaList.map(async (media) => {
            const filePath = path.join(
              media.type === 'video' ? VIDEOS_DIR : IMAGES_DIR,
              media.fileName
            )

            if (existsSync(filePath)) {
              return {
                ...media,
                url: `/uploads/${media.type}/${media.fileName}`,
                originalUrl: `/uploads/${media.type}/${media.fileName}`
              }
            }
            return null
          })

          const validationResults = await Promise.all(validationPromises)
          validMedia = validationResults.filter(result => result !== null)

        } catch (dbError) {
          // 🚨 DB 연결 실패 - 즉시 파일시스템 fallback으로 전환
          console.log('⚠️ PostgreSQL 연결 실패, 파일시스템 직접 읽기로 전환')
          console.log('🔧 파일시스템에서 직접 미디어 목록 생성...')

          const imageFiles = existsSync(IMAGES_DIR) ? await readdir(IMAGES_DIR) : []
          const videoFiles = existsSync(VIDEOS_DIR) ? await readdir(VIDEOS_DIR) : []

          let mediaCounter = 1

          // 이미지 파일 처리
          for (const fileName of imageFiles) {
            try {
              const filePath = path.join(IMAGES_DIR, fileName)
              const stats = await stat(filePath)
              validMedia.push({
                id: fileName.split('-')[0] || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName,
                originalFileName: fileName,
                title: `MODEL #${mediaCounter++}`,
                type: 'image',
                fileSize: stats.size,
                mimeType: 'image/png',
                width: null, height: null, duration: null, resolution: null,
                uploadedAt: stats.birthtime,
                url: `/uploads/image/${fileName}`,
                originalUrl: `/uploads/image/${fileName}`
              })
            } catch (e) {
              console.warn(`⚠️ 이미지 파일 처리 실패: ${fileName}`)
            }
          }

          // 비디오 파일 처리
          for (const fileName of videoFiles) {
            try {
              const filePath = path.join(VIDEOS_DIR, fileName)
              const stats = await stat(filePath)
              validMedia.push({
                id: fileName.split('-')[0] || `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName,
                originalFileName: fileName,
                title: `VIDEO #${mediaCounter++}`,
                type: 'video',
                fileSize: stats.size,
                mimeType: 'video/mp4',
                width: null, height: null, duration: null, resolution: null,
                uploadedAt: stats.birthtime,
                url: `/uploads/video/${fileName}`,
                originalUrl: `/uploads/video/${fileName}`
              })
            } catch (e) {
              console.warn(`⚠️ 비디오 파일 처리 실패: ${fileName}`)
            }
          }

          // 업로드 시간순 정렬
          validMedia.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          console.log(`✅ 파일시스템 fallback 완료: ${validMedia.length}개 파일 발견`)
        }

        // 🚀 결과 캐싱
        setCache(listCacheKey, validMedia, validMedia.length)

        console.log(`✅ 최종 미디어 목록: ${validMedia.length}개`)

        return NextResponse.json({
          success: true,
          data: validMedia,
          count: validMedia.length,
          cached: false
        })

      case 'init':
        // Railway Volume 초기화
        await ensureUploadDirs()

        return NextResponse.json({
          success: true,
          message: 'Railway Volume initialized successfully'
        })

      case 'env':
        // 🔍 환경 변수 및 설정 정보 디버깅
        return NextResponse.json({
          success: true,
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
            RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
            RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
            RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
            DATABASE_URL: process.env.DATABASE_URL ? '설정됨' : '없음',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            workingDirectory: process.cwd(),
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
          }
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

      case 'clear-cache':
        // 🧹 캐시 강제 클리어
        const pattern = searchParams.get('pattern')
        invalidateCache(pattern || undefined)

        return NextResponse.json({
          success: true,
          message: pattern ? `캐시 패턴 클리어: ${pattern}` : '전체 캐시 클리어',
          timestamp: new Date().toISOString()
        })

      case 'sync':
        // 🔄 수동 DB-파일 동기화
        console.log('🔄 수동 동기화 요청됨')
        const manualSyncResult = await syncMediaStorage()

        if (manualSyncResult.success) {
          // 동기화 후 캐시 무효화
          invalidateCache()
        }

        return NextResponse.json({
          success: manualSyncResult.success,
          data: manualSyncResult.stats || null,
          error: manualSyncResult.error || null,
          timestamp: new Date().toISOString()
        })

      case 'health':
        // 🏥 Health Check - Railway 배포 및 파일 시스템 상태 확인
        const healthStartTime = Date.now()
        let healthStatus = 'healthy'
        const healthChecks = {}

        try {
          // 1. 데이터베이스 연결 확인
          try {
            const dbCheck = await prisma.$queryRaw`SELECT 1 as test`
            healthChecks.database = { status: 'ok', latency: Date.now() - healthStartTime }
          } catch (dbError) {
            healthChecks.database = {
              status: 'error',
              error: dbError instanceof Error ? dbError.message : 'Database connection failed'
            }
            healthStatus = 'unhealthy'
          }

          // 2. Railway Volume 마운트 확인
          const volumeCheck = {
            mounted: !!process.env.RAILWAY_VOLUME_MOUNT_PATH,
            path: process.env.RAILWAY_VOLUME_MOUNT_PATH || 'not_set',
            uploadsDir: existsSync(UPLOADS_DIR),
            imagesDir: existsSync(IMAGES_DIR),
            videosDir: existsSync(VIDEOS_DIR)
          }
          healthChecks.volume = volumeCheck

          if (!volumeCheck.uploadsDir || !volumeCheck.imagesDir || !volumeCheck.videosDir) {
            healthStatus = 'degraded'
          }

          // 3. 파일 시스템 권한 확인
          try {
            const testFilePath = path.join(UPLOADS_DIR, '.health-check')
            await writeFile(testFilePath, 'health check')
            await unlink(testFilePath)
            healthChecks.filesystem = { status: 'ok', writable: true }
          } catch (fsError) {
            healthChecks.filesystem = {
              status: 'error',
              writable: false,
              error: fsError instanceof Error ? fsError.message : 'Filesystem not writable'
            }
            healthStatus = 'unhealthy'
          }

          // 4. DB-파일 동기화 상태 확인
          const syncCheck = await syncMediaStorage()
          healthChecks.sync = {
            status: syncCheck.success ? 'ok' : 'warning',
            orphanedDbRecords: syncCheck.stats?.orphanedDbRecords || 0,
            orphanedFiles: syncCheck.stats?.orphanedFiles || 0,
            lastCheck: new Date().toISOString()
          }

          if (!syncCheck.success || (syncCheck.stats?.orphanedDbRecords || 0) > 10) {
            healthStatus = 'degraded'
          }

          // 5. 전체 상태 요약
          const totalLatency = Date.now() - healthStartTime

          return NextResponse.json({
            success: true,
            status: healthStatus,
            timestamp: new Date().toISOString(),
            environment: {
              railway: isRailway,
              node_env: process.env.NODE_ENV,
              railway_env: process.env.RAILWAY_ENVIRONMENT,
              uptime: process.uptime()
            },
            checks: healthChecks,
            performance: {
              totalLatency,
              cacheEntries: 'N/A' // Cache stats functionality would go here
            }
          })

        } catch (healthError) {
          return NextResponse.json({
            success: false,
            status: 'error',
            error: healthError instanceof Error ? healthError.message : 'Health check failed',
            timestamp: new Date().toISOString(),
            checks: healthChecks
          }, { status: 500 })
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
        const enableProcessing = formData.get('enableProcessing') === 'true' || metadata.enableProcessing === true

        if (!file) {
          return NextResponse.json({
            success: false,
            error: 'No file provided'
          }, { status: 400 })
        }

        // 🚀 파일 크기 검증 (500MB 제한)
        const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({
            success: false,
            error: `파일 크기가 500MB 제한을 초과합니다: ${(file.size / 1024 / 1024).toFixed(1)}MB`
          }, { status: 413 }) // Payload Too Large
        }

        console.log(`🔄 Railway Upload: ${file.name} 시작 (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        console.log(`⚙️ 파일 처리 옵션: ${enableProcessing ? '활성화' : '비활성화'}`)

        const isVideo = file.type.startsWith('video/')
        const isImage = file.type.startsWith('image/')
        const targetDir = isVideo ? VIDEOS_DIR : IMAGES_DIR

        // 고유 파일명 생성
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`

        let processedResult = null
        let finalMediaData = null

        try {
          if (enableProcessing) {
            // 🎬 파일 타입별 처리 활성화
            if (isVideo) {
              console.log(`🎬 비디오 처리 시작: ${file.name}`)
              console.log(`📏 원본 비디오: ${(file.size / (1024 * 1024)).toFixed(1)}MB`)

              // FFmpeg 설치 확인
              const hasFFmpeg = await VideoProcessor.checkFFmpegInstallation()
              if (!hasFFmpeg) {
                console.warn('⚠️ FFmpeg 미설치 - 원본 저장 모드로 전환')
                throw new Error('FFmpeg not available')
              }

              console.log('✅ FFmpeg 설치 확인됨 - 비디오 압축 시작')

              // 비디오 처리 실행
              processedResult = await VideoProcessor.processVideo(
                file,
                targetDir,
                uniqueFileName,
                {
                  maxWidth: metadata.maxWidth || 1920,
                  maxHeight: metadata.maxHeight || 1080,
                  quality: metadata.quality || 'medium',
                  thumbnailTime: metadata.thumbnailTime || 1
                },
                (stage, percent) => {
                  console.log(`🎬 비디오 처리 진행: ${stage} ${percent}%`)
                }
              )

              // DB 저장용 데이터 준비
              finalMediaData = {
                fileName: path.basename(processedResult.compressed.path),
                originalFileName: file.name,
                fileSize: processedResult.compressed.size,
                width: processedResult.metadata.width,
                height: processedResult.metadata.height,
                duration: processedResult.metadata.duration,
                resolution: `${processedResult.metadata.width}x${processedResult.metadata.height}`,
                thumbnailUrl: processedResult.thumbnail.url,
                previewUrl: processedResult.preview.url
              }

              const compressionRatio = Math.round((1 - processedResult.compressed.size / file.size) * 100)
              console.log(`✅ 비디오 처리 완료: ${file.name}`)
              console.log(`📊 압축 결과: ${(file.size / (1024 * 1024)).toFixed(1)}MB → ${(processedResult.compressed.size / (1024 * 1024)).toFixed(1)}MB (${compressionRatio}% 절약)`)
              console.log(`🎯 최종 파일: ${path.basename(processedResult.compressed.path)}`)

            } else if (isImage) {
              console.log(`🖼️ 이미지 처리 시작: ${file.name}`)
              console.log(`📏 원본 이미지: ${(file.size / (1024 * 1024)).toFixed(1)}MB, 포맷: ${file.type}`)
              console.log('🔄 WebP 변환 + 썸네일 생성 시작...')

              // 이미지 처리 실행
              processedResult = await ImageProcessor.processImage(
                file,
                targetDir,
                uniqueFileName
              )

              // DB 저장용 데이터 준비 (WebP 파일을 메인으로 사용)
              finalMediaData = {
                fileName: path.basename(processedResult.webp.path),
                originalFileName: file.name,
                fileSize: processedResult.webp.url.includes('webp') ? Math.round(file.size * 0.7) : file.size, // WebP 압축 고려
                width: processedResult.webp.width,
                height: processedResult.webp.height,
                duration: null,
                resolution: null,
                thumbnailUrl: processedResult.thumbnail.url,
                webpUrl: processedResult.webp.url
              }

              console.log(`✅ 이미지 처리 완료: ${file.name}`)
              console.log(`📊 변환 결과:`)
              console.log(`  └ WebP: ${path.basename(processedResult.webp.path)} (메인 표시용)`)
              console.log(`  └ 썸네일: ${path.basename(processedResult.thumbnail.path)}`)
              console.log(`  └ 원본: ${path.basename(processedResult.original.path)} (백업용)`)
              console.log(`🎯 갤러리 표시 파일: ${path.basename(processedResult.webp.path)}`)
            }
          }

          // 처리 실패 또는 비활성화 시 원본 저장 모드
          if (!processedResult) {
            console.log(`📁 원본 저장 모드: ${file.name}`)

            const filePath = path.join(targetDir, uniqueFileName)
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            await writeFile(filePath, buffer)

            // 파일 저장 검증
            const fileStats = await stat(filePath)
            if (fileStats.size !== buffer.length) {
              throw new Error(`파일 크기 불일치: 예상 ${buffer.length}, 실제 ${fileStats.size}`)
            }

            // 기본 메타데이터 설정
            finalMediaData = {
              fileName: uniqueFileName,
              originalFileName: file.name,
              fileSize: file.size,
              width: metadata.width || (isVideo ? 1920 : 800),
              height: metadata.height || (isVideo ? 1080 : 600),
              duration: isVideo ? metadata.duration : null,
              resolution: isVideo ? metadata.resolution || '1920x1080' : null,
              thumbnailUrl: null,
              webpUrl: null,
              previewUrl: null
            }

            console.log(`✅ 원본 파일 저장 완료: ${filePath}`)
          }

          // 🔄 DB 저장과 파일 저장 트랜잭션 처리
          let mediaRecord
          await prisma.$transaction(async (tx) => {
            // 자동 번호 생성을 위한 기존 미디어 개수 조회
            const existingCount = await tx.media.count({
              where: { type: isVideo ? 'video' : 'image' },
            })
            const autoNumber = existingCount + 1
            const autoTitle = isVideo ? `VIDEO #${autoNumber}` : `MODEL #${autoNumber}`

            // PostgreSQL에 메타데이터 저장
            mediaRecord = await tx.media.create({
              data: {
                id: finalMediaData.fileName.split('.')[0],
                fileName: finalMediaData.fileName,
                originalFileName: finalMediaData.originalFileName,
                title: autoTitle,
                type: isVideo ? 'video' : 'image',
                fileSize: finalMediaData.fileSize,
                mimeType: file.type,
                width: finalMediaData.width,
                height: finalMediaData.height,
                duration: finalMediaData.duration,
                resolution: finalMediaData.resolution,
                uploadedAt: new Date()
              }
            })
          })

          console.log(`✅ PostgreSQL 메타데이터 저장: ${mediaRecord.id}`)

          // 🚀 업로드 성공 후 즉시 캐시 무효화 (실시간 업데이트)
          invalidateCache('list')
          console.log('♻️ 업로드 완료 → 목록 캐시 무효화')

          // 응답 데이터 구성 (직접 서빙 URL 사용)
          const responseData = {
            ...mediaRecord,
            url: `/uploads/${mediaRecord.type}/${mediaRecord.fileName}`,
            originalUrl: `/uploads/${mediaRecord.type}/${mediaRecord.fileName}`,
            processed: !!processedResult,
            processingInfo: processedResult ? {
              thumbnailUrl: finalMediaData.thumbnailUrl,
              webpUrl: finalMediaData.webpUrl,
              previewUrl: finalMediaData.previewUrl,
              compression: isVideo && processedResult ? {
                originalSize: file.size,
                compressedSize: processedResult.compressed.size,
                compressionRatio: Math.round((1 - processedResult.compressed.size / file.size) * 100)
              } : null
            } : null
          }

          return NextResponse.json({
            success: true,
            data: responseData
          })

        } catch (processingError) {
          console.error(`❌ 파일 처리 실패: ${file.name}`, processingError)
          console.log(`🔄 원본 파일로 fallback 저장 시도...`)

          // 처리 실패 시에도 원본 저장 시도
          try {
            const filePath = path.join(targetDir, uniqueFileName)
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            await writeFile(filePath, buffer)

            // 기본 메타데이터로 DB 저장
            let fallbackRecord
            await prisma.$transaction(async (tx) => {
              const existingCount = await tx.media.count({
                where: { type: isVideo ? 'video' : 'image' },
              })
              const autoNumber = existingCount + 1
              const autoTitle = isVideo ? `VIDEO #${autoNumber}` : `MODEL #${autoNumber}`

              fallbackRecord = await tx.media.create({
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
            })

            invalidateCache('list')

            return NextResponse.json({
              success: true,
              data: {
                ...fallbackRecord,
                url: `/uploads/${fallbackRecord.type}/${fallbackRecord.fileName}`,
                originalUrl: `/uploads/${fallbackRecord.type}/${fallbackRecord.fileName}`,
                processed: false,
                processingError: processingError instanceof Error ? processingError.message : 'Processing failed'
              }
            })

          } catch (fallbackError) {
            console.error(`❌ 원본 저장도 실패: ${file.name}`, fallbackError)
            throw fallbackError
          }
        }


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

            // 파일 저장 (강화된 디버깅)
            console.log(`💾 파일 저장 시작: ${file.name}`)
            console.log(`📁 대상 디렉토리: ${targetDir}`)
            console.log(`📄 파일 경로: ${filePath}`)
            console.log(`🌍 Volume 경로: ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`)
            console.log(`📏 파일 크기: ${file.size} bytes`)

            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // 파일 저장 전 디렉토리 다시 확인
            if (!existsSync(targetDir)) {
              console.log(`📁 디렉토리 재생성: ${targetDir}`)
              await mkdir(targetDir, { recursive: true })
            }

            await writeFile(filePath, buffer)

            // 저장 후 확인
            if (existsSync(filePath)) {
              const stats = await stat(filePath)
              console.log(`✅ 파일 저장 성공: ${filePath}`)
              console.log(`📏 저장된 크기: ${stats.size} bytes`)
              console.log(`🕒 저장 시간: ${stats.mtime}`)
            } else {
              throw new Error(`파일 저장 실패: ${filePath}`)
            }

            // 자동 번호 생성 (배치 최적화)
            const existingCount = await prisma.media.count({
              where: { type: isVideo ? 'video' : 'image' },
              // TODO: 배치 업로드 시 카운트 캐싱 고려
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
                url: `/uploads/${mediaRecord.type}/${mediaRecord.fileName}`
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

        // 🚀 업로드 성공 시 캐시 무효화
        if (successCount > 0) {
          invalidateCache('list')
          console.log(`🧹 업로드 완료 후 캐시 무효화: ${successCount}개 파일`)
        }

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
  const action = searchParams.get('action')

  try {
    // Bulk deletion actions
    if (action === 'clear-all') {
      console.log('🗑️ Railway: 전체 미디어 삭제 시작')

      // PostgreSQL에서 모든 미디어 조회
      const allMedia = await prisma.media.findMany()
      let deletedCount = 0
      let errors = []

      // 각 파일 삭제 (안전 모드 - 에러 무시)
      for (const media of allMedia) {
        try {
          const filePath = path.join(
            media.type === 'video' ? VIDEOS_DIR : IMAGES_DIR,
            media.fileName
          )

          if (existsSync(filePath)) {
            await unlink(filePath)
            console.log(`🗑️ 파일 삭제: ${filePath}`)
          } else {
            console.log(`⚠️ 파일 없음 (스킵): ${filePath}`)
          }

          deletedCount++
        } catch (fileError) {
          console.warn(`⚠️ 파일 삭제 실패 (계속 진행): ${media.fileName}`, fileError)
          errors.push(`File: ${media.fileName}`)
          deletedCount++ // 파일 삭제 실패해도 카운트 증가
        }
      }

      // PostgreSQL에서 모든 미디어 레코드 삭제 (핵심 작업)
      const dbResult = await prisma.media.deleteMany({})
      console.log(`✅ DB 레코드 삭제: ${dbResult.count}개`)

      // 캐시 무효화
      invalidateCache()

      return NextResponse.json({
        success: true,
        message: `모든 미디어 삭제 완료: 파일 ${deletedCount}개, DB 레코드 ${dbResult.count}개`,
        deletedFiles: deletedCount,
        deletedRecords: dbResult.count,
        errors: errors.length > 0 ? errors : null
      })
    }

    if (action === 'clear-videos') {
      console.log('🗑️ Railway: 비디오 삭제 시작')

      // PostgreSQL에서 비디오 미디어 조회
      const videos = await prisma.media.findMany({
        where: { type: 'video' }
      })
      let deletedCount = 0
      let errors = []

      // 각 비디오 파일 삭제
      for (const video of videos) {
        try {
          const filePath = path.join(VIDEOS_DIR, video.fileName)
          if (existsSync(filePath)) {
            await unlink(filePath)
            console.log(`🗑️ 비디오 파일 삭제: ${filePath}`)
          }
          deletedCount++
        } catch (fileError) {
          console.warn(`⚠️ 비디오 파일 삭제 실패: ${video.fileName}`, fileError)
          errors.push(`Video: ${video.fileName}`)
        }
      }

      // PostgreSQL에서 비디오 레코드 삭제
      const dbResult = await prisma.media.deleteMany({
        where: { type: 'video' }
      })
      console.log(`✅ 비디오 DB 레코드 삭제: ${dbResult.count}개`)

      // 캐시 무효화
      invalidateCache()

      return NextResponse.json({
        success: true,
        message: `비디오 삭제 완료: 파일 ${deletedCount}개, DB 레코드 ${dbResult.count}개`,
        deletedFiles: deletedCount,
        deletedRecords: dbResult.count,
        errors: errors.length > 0 ? errors : null
      })
    }

    if (action === 'clear-images') {
      console.log('🗑️ Railway: 이미지 삭제 시작')

      // PostgreSQL에서 이미지 미디어 조회
      const images = await prisma.media.findMany({
        where: { type: 'image' }
      })
      let deletedCount = 0
      let errors = []

      // 각 이미지 파일 삭제
      for (const image of images) {
        try {
          const filePath = path.join(IMAGES_DIR, image.fileName)
          if (existsSync(filePath)) {
            await unlink(filePath)
            console.log(`🗑️ 이미지 파일 삭제: ${filePath}`)
          }
          deletedCount++
        } catch (fileError) {
          console.warn(`⚠️ 이미지 파일 삭제 실패: ${image.fileName}`, fileError)
          errors.push(`Image: ${image.fileName}`)
        }
      }

      // PostgreSQL에서 이미지 레코드 삭제
      const dbResult = await prisma.media.deleteMany({
        where: { type: 'image' }
      })
      console.log(`✅ 이미지 DB 레코드 삭제: ${dbResult.count}개`)

      // 캐시 무효화
      invalidateCache()

      return NextResponse.json({
        success: true,
        message: `이미지 삭제 완료: 파일 ${deletedCount}개, DB 레코드 ${dbResult.count}개`,
        deletedFiles: deletedCount,
        deletedRecords: dbResult.count,
        errors: errors.length > 0 ? errors : null
      })
    }

    // Individual media deletion
    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: 'Media ID required for individual deletion'
      }, { status: 400 })
    }

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

    // 🚀 삭제 완료 후 캐시 무효화
    invalidateCache('list')
    console.log(`🧹 삭제 완료 후 캐시 무효화: ${mediaId}`)

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

    // 🚀 업데이트 완료 후 캐시 무효화
    invalidateCache('list')
    console.log(`🧹 업데이트 완료 후 캐시 무효화: ${id}`)

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