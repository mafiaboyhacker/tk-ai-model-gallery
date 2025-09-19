/**
 * 헬스체크 API - 인증 없이 접근 가능한 간단한 테스트
 */

import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🏥 헬스체크 시작 (v3 - 새 배포 확인):', new Date().toISOString())
  console.log('🌍 RAILWAY_VOLUME_MOUNT_PATH:', process.env.RAILWAY_VOLUME_MOUNT_PATH)

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'AI Model Gallery API is running',
    environment: process.env.NODE_ENV,
    hasRailwayDatabase: !!process.env.DATABASE_URL,
    hasRailwayEnvironment: !!process.env.RAILWAY_ENVIRONMENT,
    railwayVolumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH,
    version: 'v3'
  })
}