/**
 * Supabase Storage API Routes
 * 서버 사이드에서 SERVICE_ROLE_KEY를 사용한 Storage 작업
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버 사이드 전용 Supabase Admin 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKET_NAME = 'media'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'list':
        // 미디어 목록 조회
        const allMedia: any[] = []
        const folders = ['images', 'videos']

        for (const folder of folders) {
          const { data: files, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .list(folder, {
              limit: 1000,
              sortBy: { column: 'created_at', order: 'desc' }
            })

          if (error) {
            console.warn(`⚠️ ${folder} 폴더 조회 실패:`, error.message)
            continue
          }

          if (!files) continue

          for (const file of files) {
            if (!file.name || file.name === '.emptyFolderPlaceholder') continue

            const filePath = `${folder}/${file.name}`
            const { data: urlData } = supabaseAdmin.storage
              .from(BUCKET_NAME)
              .getPublicUrl(filePath)

            const isVideo = folder === 'videos'
            const fileId = file.name.split('.')[0]

            const media = {
              id: fileId,
              fileName: file.name,
              url: urlData.publicUrl,
              originalUrl: urlData.publicUrl,
              type: isVideo ? 'video' : 'image',
              width: isVideo ? 1920 : 800,
              height: isVideo ? 1080 : 600,
              fileSize: file.metadata?.size || 0,
              bucketPath: filePath,
              uploadedAt: file.created_at || new Date().toISOString(),
              duration: isVideo ? undefined : undefined,
              resolution: isVideo ? '1920x1080' : undefined,
              metadata: file.metadata || {}
            }

            allMedia.push(media)
          }
        }

        // 최신순으로 정렬
        const sortedMedia = allMedia.sort((a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )

        return NextResponse.json({
          success: true,
          data: sortedMedia,
          count: sortedMedia.length
        })

      case 'init':
        // Storage 초기화 및 버킷 생성
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

        if (listError) {
          return NextResponse.json({
            success: false,
            error: listError.message
          }, { status: 500 })
        }

        const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

        if (!bucketExists) {
          const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
            public: true,
            allowedMimeTypes: [
              'image/jpeg', 'image/png', 'image/webp', 'image/gif',
              'video/mp4', 'video/webm', 'video/quicktime'
            ],
            fileSizeLimit: 50 * 1024 * 1024, // 50MB per file
          })

          if (createError) {
            return NextResponse.json({
              success: false,
              error: createError.message
            }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            message: 'Bucket created successfully',
            data: bucket
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Bucket already exists'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Storage API 오류:', error)
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
    // 먼저 미디어 목록에서 파일 정보 찾기
    const listResponse = await GET(new NextRequest(`${request.url}?action=list`))
    const listData = await listResponse.json()

    if (!listData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get media list'
      }, { status: 500 })
    }

    const targetMedia = listData.data.find((m: any) => m.id === mediaId)
    if (!targetMedia) {
      return NextResponse.json({
        success: false,
        error: 'Media not found'
      }, { status: 404 })
    }

    // 파일 삭제
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([targetMedia.bucketPath])

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 })
    }

    // 메타데이터 파일도 삭제
    const metadataPath = `metadata/${mediaId}.json`
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([metadataPath])

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })
  } catch (error) {
    console.error('❌ 미디어 삭제 오류:', error)
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
    switch (action) {
      case 'upload':
        // 파일 업로드
        const formData = await request.formData()
        const file = formData.get('file') as File
        const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

        if (!file) {
          return NextResponse.json({
            success: false,
            error: 'No file provided'
          }, { status: 400 })
        }

        console.log(`🔄 API Route: 파일 업로드 시작 - ${file.name}`)

        // 파일 타입별 폴더 결정
        const isVideo = file.type.startsWith('video/')
        const folder = isVideo ? 'videos' : 'images'

        // 고유한 파일명 생성 (timestamp + random)
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`
        const filePath = `${folder}/${uniqueFileName}`

        console.log(`📁 업로드 경로: ${filePath}`)

        // 파일을 ArrayBuffer로 변환
        const arrayBuffer = await file.arrayBuffer()

        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('❌ Supabase Storage 업로드 실패:', uploadError)
          return NextResponse.json({
            success: false,
            error: uploadError.message
          }, { status: 500 })
        }

        console.log(`✅ Supabase Storage 업로드 성공:`, uploadData.path)

        // Public URL 생성
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)

        // 메타데이터 저장
        const mediaMetadata = {
          id: uniqueFileName.split('.')[0],
          fileName: file.name,
          originalFileName: file.name,
          url: urlData.publicUrl,
          originalUrl: urlData.publicUrl,
          type: isVideo ? 'video' : 'image',
          fileSize: file.size,
          mimeType: file.type,
          bucketPath: filePath,
          uploadedAt: new Date().toISOString(),
          width: metadata.width || (isVideo ? 1920 : 800),
          height: metadata.height || (isVideo ? 1080 : 600),
          duration: isVideo ? metadata.duration : undefined,
          resolution: isVideo ? metadata.resolution || '1920x1080' : undefined,
          ...metadata
        }

        // 메타데이터를 별도 파일로 저장
        const metadataPath = `metadata/${mediaMetadata.id}.json`
        const { error: metaError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(metadataPath, JSON.stringify(mediaMetadata, null, 2), {
            contentType: 'application/json',
            cacheControl: '3600'
          })

        if (metaError) {
          console.warn('⚠️ 메타데이터 저장 실패:', metaError.message)
        }

        console.log(`✅ 파일 업로드 완료: ${file.name} → ${filePath}`)

        return NextResponse.json({
          success: true,
          data: mediaMetadata
        })

      case 'forceDeleteAll':
        // 강제 전체 삭제 (수동 복구용)
        console.log('🚨 API를 통한 강제 전체 삭제 시작')

        const errors: string[] = []
        let deletedCount = 0

        // 각 폴더별로 모든 파일 나열 및 삭제
        const folders = ['images', 'videos', 'metadata']

        for (const folder of folders) {
          console.log(`🗂️ ${folder} 폴더 정리 중...`)

          // 폴더의 모든 파일 나열
          const { data: files, error: listError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .list(folder, { limit: 1000 })

          if (listError) {
            console.warn(`⚠️ ${folder} 폴더 나열 실패:`, listError.message)
            errors.push(`${folder} 폴더 나열 실패: ${listError.message}`)
            continue
          }

          if (!files || files.length === 0) {
            console.log(`✅ ${folder} 폴더가 이미 비어있습니다`)
            continue
          }

          // 파일 경로 생성
          const filePaths = files.map(file => `${folder}/${file.name}`)

          console.log(`🗑️ ${folder} 폴더에서 ${filePaths.length}개 파일 삭제 중...`)

          // 배치 삭제 (최대 100개씩)
          const batchSize = 100
          for (let i = 0; i < filePaths.length; i += batchSize) {
            const batch = filePaths.slice(i, i + batchSize)

            const { error: deleteError } = await supabaseAdmin.storage
              .from(BUCKET_NAME)
              .remove(batch)

            if (deleteError) {
              console.error(`❌ ${folder} 배치 삭제 실패:`, deleteError.message)
              errors.push(`${folder} 배치 삭제 실패: ${deleteError.message}`)
            } else {
              deletedCount += batch.length
              console.log(`✅ ${folder}에서 ${batch.length}개 파일 삭제 완료`)
            }
          }
        }

        console.log(`🎯 강제 삭제 완료: ${deletedCount}개 파일 삭제, ${errors.length}개 오류`)

        return NextResponse.json({
          success: errors.length === 0,
          deletedCount,
          errors,
          message: `${deletedCount}개 파일 삭제 완료`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ POST 요청 처리 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}