import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import sharp from 'sharp'

// GET /api/models - 모든 모델 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    
    const skip = (page - 1) * limit
    
    const where = category && category !== 'all' 
      ? { category: category.toUpperCase() as any }
      : {}
    
    const [models, total] = await Promise.all([
      prisma.aIModel.findMany({
        where: {
          ...where,
          isPublic: true,
          status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aIModel.count({
        where: {
          ...where,
          isPublic: true,
          status: 'APPROVED'
        }
      })
    ])

    return NextResponse.json({
      models,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('모델 조회 오류:', error)
    return NextResponse.json({ error: '모델을 불러올 수 없습니다.' }, { status: 500 })
  }
}

// POST /api/models - 새 모델 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string || 'SPECIAL'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const uploadedModels = []

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue
      }

      // 파일명에서 메타데이터 추출
      const filename = file.name
      const { extractedPrompt, aiGenerationTool, seriesUuid, variationNumber } = 
        await extractMetadataFromFilename(filename)

      let processedFile: Buffer
      let dimensions = { width: 0, height: 0 }

      if (file.type.startsWith('image/')) {
        // 이미지 처리 및 최적화
        const buffer = Buffer.from(await file.arrayBuffer())
        processedFile = await sharp(buffer)
          .webp({ quality: 85 })
          .toBuffer()
        
        const metadata = await sharp(buffer).metadata()
        dimensions = { 
          width: metadata.width || 0, 
          height: metadata.height || 0 
        }
      } else {
        // 비디오는 원본 그대로 업로드
        processedFile = Buffer.from(await file.arrayBuffer())
      }

      // Vercel Blob에 파일 업로드
      const blob = await put(`models/${Date.now()}-${filename}`, processedFile, {
        access: 'public',
      })

      // 데이터베이스에 모델 정보 저장
      const model = await prisma.aIModel.create({
        data: {
          name: filename.replace(/\.[^/.]+$/, ''), // 확장자 제거
          slug: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          originalFilename: filename,
          fileUrl: blob.url,
          fileSize: file.size,
          dimensions: dimensions,
          aiGenerationTool,
          extractedPrompt,
          seriesUuid,
          variationNumber,
          category: category.toUpperCase() as any,
          uploadedById: 'admin-user', // TODO: 실제 사용자 ID로 교체
          isPublic: true,
          status: 'APPROVED'
        }
      })

      uploadedModels.push(model)
    }

    return NextResponse.json({ 
      success: true, 
      models: uploadedModels,
      message: `${uploadedModels.length}개 모델이 성공적으로 업로드되었습니다.`
    })

  } catch (error) {
    console.error('모델 업로드 오류:', error)
    return NextResponse.json({ 
      error: '모델 업로드 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// 파일명에서 메타데이터 추출 (기존 file-parser.ts 로직 활용)
async function extractMetadataFromFilename(filename: string) {
  const patterns = [
    /^u(\d+)_(.+)_([a-f0-9-]{36})_(\d+)\./,
    /^social_u(\d+)_(.+)_([a-f0-9-]{36})_(\d+)\./,
    /^generation-([a-f0-9-]{36})\./,
    /^imgvnf_(.+)_([a-f0-9-]{36})_(\d+)\./
  ]

  for (const pattern of patterns) {
    const match = filename.match(pattern)
    if (match) {
      if (pattern.source.includes('generation')) {
        return {
          extractedPrompt: 'Generated image',
          aiGenerationTool: 'generation',
          seriesUuid: match[1],
          variationNumber: 0
        }
      } else {
        const toolPrefix = match[0].startsWith('social_') ? 'social_' : ''
        return {
          extractedPrompt: match[2]?.replace(/_/g, ' ') || '',
          aiGenerationTool: `${toolPrefix}u${match[1] || 'unknown'}`,
          seriesUuid: match[3] || match[2],
          variationNumber: parseInt(match[4] || '0')
        }
      }
    }
  }

  return {
    extractedPrompt: filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    aiGenerationTool: 'unknown',
    seriesUuid: null,
    variationNumber: 0
  }
}