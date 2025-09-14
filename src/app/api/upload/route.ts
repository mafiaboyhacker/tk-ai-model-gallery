/**
 * Supabase Storage 업로드 API
 * 이미지와 비디오 파일을 Supabase Storage에 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// 지원하는 파일 형식
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Supabase 파일 업로드 API 시작')

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다.' },
        { status: 400 }
      )
    }

    console.log(`📁 업로드할 파일 수: ${files.length}`)

    const uploadResults = []

    for (const file of files) {
      try {
        // 파일 검증
        const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type)
        const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
          console.log(`❌ 지원하지 않는 파일 형식: ${file.type}`)
          continue
        }

        if (file.size > MAX_FILE_SIZE) {
          console.log(`❌ 파일 크기 초과: ${file.size}`)
          continue
        }

        // 고유 파일명 생성
        const fileId = uuidv4()
        const fileExt = file.name.split('.').pop()
        const fileName = `${fileId}.${fileExt}`
        const bucket = isImage ? 'images' : 'videos'
        const filePath = `${bucket}/${fileName}`

        console.log(`📤 업로드 중: ${file.name} → ${filePath}`)

        // 파일을 ArrayBuffer로 변환
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('media')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`❌ 업로드 실패 (${file.name}):`, uploadError)
          continue
        }

        console.log(`✅ 업로드 성공: ${uploadData.path}`)

        // Public URL 생성
        const { data: urlData } = supabaseAdmin.storage
          .from('media')
          .getPublicUrl(filePath)

        // 이미지인 경우 크기 정보 설정
        let width = 0
        let height = 0
        let duration = 0

        if (isImage) {
          // 기본 크기 설정 (실제로는 이미지를 분석해야 함)
          width = 800
          height = 600
        } else {
          // 비디오인 경우 기본 해상도
          width = 1920
          height = 1080
          duration = 30 // 기본 30초
        }

        const result = {
          id: fileId,
          fileName: file.name,
          originalFileName: file.name,
          url: urlData.publicUrl,
          originalUrl: urlData.publicUrl,
          path: filePath,
          type: isImage ? 'image' : 'video',
          mimeType: file.type,
          size: file.size,
          width,
          height,
          duration: isVideo ? duration : undefined,
          uploadedAt: new Date().toISOString()
        }

        uploadResults.push(result)

      } catch (fileError) {
        console.error(`❌ 파일 처리 실패 (${file.name}):`, fileError)
      }
    }

    console.log(`✅ 업로드 완료: ${uploadResults.length}개 파일`)

    return NextResponse.json({
      success: true,
      message: `${uploadResults.length}개 파일이 성공적으로 업로드되었습니다.`,
      files: uploadResults
    })

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error)
    return NextResponse.json(
      {
        error: '파일 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: '삭제할 파일 경로가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`🗑️ 파일 삭제 중: ${filePath}`)

    const { error } = await supabaseAdmin.storage
      .from('media')
      .remove([filePath])

    if (error) {
      console.error('❌ 파일 삭제 실패:', error)
      return NextResponse.json(
        { error: '파일 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`✅ 파일 삭제 완료: ${filePath}`)

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('❌ 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}