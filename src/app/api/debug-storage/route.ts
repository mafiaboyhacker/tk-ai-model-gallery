/**
 * 스토리지 상태 디버그 API
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 데이터베이스에서 실제 모델 수 확인
    const modelCount = await prisma.aIModel.count()
    const models = await prisma.aIModel.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fileType: true,
        createdAt: true,
        fileUrl: true
      }
    })

    // 환경 변수 확인
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
      RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
      hostname: process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    }

    return NextResponse.json({
      success: true,
      storage: 'Railway PostgreSQL',
      database: {
        connected: true,
        modelCount,
        recentModels: models
      },
      environment: env,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      storage: 'Railway PostgreSQL (Failed)',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}