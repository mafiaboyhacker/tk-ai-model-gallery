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