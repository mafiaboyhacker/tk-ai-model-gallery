import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export async function GET(request: NextRequest) {
  try {
    const baseUploadPath = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'public')
    const uploadsDir = path.join(baseUploadPath, 'uploads')
    
    // uploads 폴더가 없으면 생성
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // 폴더가 이미 존재하는 경우 무시
    }
    
    try {
      const files = await readdir(uploadsDir)
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|mp4|mov)$/i.test(file)
      )
      
      const images = await Promise.all(
        imageFiles.map(async (file, index) => {
          const filePath = path.join(uploadsDir, file)
          const stats = await stat(filePath)
          const isVideo = /\.(mp4|mov)$/i.test(file)
          
          let width = 400
          let height = 600
          
          // 이미지인 경우 실제 크기 가져오기
          if (!isVideo) {
            try {
              const metadata = await sharp(filePath).metadata()
              width = metadata.width || 400
              height = metadata.height || 600
            } catch (error) {
              console.warn(`Failed to get metadata for ${file}:`, error)
            }
          }
          
          return {
            id: `file-${stats.birthtime.getTime()}-${index}`,
            url: `/uploads/${file}`,
            width,
            height,
            fileName: file,
            uploadedAt: stats.birthtime.getTime(),
            fileSize: stats.size,
            type: isVideo 
              ? 'video/mp4' 
              : file.match(/\.(png)$/i) 
                ? 'image/png'
                : file.match(/\.(webp)$/i)
                  ? 'image/webp'
                  : 'image/jpeg'
          }
        })
      )
      
      // 업로드 시간 순으로 정렬 (최신순)
      images.sort((a, b) => b.uploadedAt - a.uploadedAt)
      
      return NextResponse.json({
        success: true,
        images,
        count: images.length,
        message: `Found ${images.length} files in uploads directory`
      })
      
    } catch (dirError) {
      console.log('No uploads directory found, returning empty array')
      return NextResponse.json({
        success: true,
        images: [],
        count: 0,
        message: 'No uploads directory found'
      })
    }
    
  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get images',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}