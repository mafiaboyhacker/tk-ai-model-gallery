import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json()
    
    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // public/uploads 디렉토리 생성 (없으면)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    const migratedImages: any[] = []

    for (const image of images) {
      // Base64 URL인지 확인
      if (!image.url || !image.url.startsWith('data:')) {
        // 이미 파일 시스템 URL인 경우 그대로 유지
        migratedImages.push(image)
        continue
      }

      try {
        // Base64 데이터에서 파일 데이터 추출
        const base64Data = image.url.split(',')[1]
        const mimeType = image.url.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
        
        // 파일 확장자 결정
        const ext = mimeType.split('/')[1] || 'jpg'
        
        // 파일명 생성
        const timestamp = image.uploadedAt || Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        const sanitizedFileName = (image.fileName || 'image').replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `migrated-${timestamp}-${randomId}-${sanitizedFileName}.${ext}`
        
        // 파일 경로
        const filePath = path.join(uploadDir, fileName)
        
        // Base64 데이터를 버퍼로 변환하여 파일로 저장
        const buffer = Buffer.from(base64Data, 'base64')
        await writeFile(filePath, buffer)
        
        // 새로운 이미지 정보 생성
        migratedImages.push({
          ...image,
          url: `/uploads/${fileName}`, // 새로운 파일 시스템 URL
          migrated: true,
          migratedAt: Date.now()
        })
        
      } catch (error) {
        console.error(`Failed to migrate image ${image.id}:`, error)
        // 마이그레이션 실패한 이미지는 원본 유지
        migratedImages.push(image)
      }
    }

    return NextResponse.json({ 
      success: true, 
      images: migratedImages,
      migratedCount: migratedImages.filter(img => img.migrated).length
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}