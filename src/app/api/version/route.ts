import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 🚀 버전 정보 생성
    const versionInfo = {
      version: process.env.npm_package_version || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA ||
                 process.env.RAILWAY_GIT_COMMIT_SHA ||
                 process.env.GIT_COMMIT ||
                 'unknown',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      deploymentPlatform: process.env.RAILWAY_ENVIRONMENT
        ? 'Railway'
        : process.env.VERCEL
        ? 'Vercel'
        : 'Local'
    }

    // 🔍 환경별 추가 정보
    if (process.env.RAILWAY_ENVIRONMENT) {
      Object.assign(versionInfo, {
        railwayProjectId: process.env.RAILWAY_PROJECT_ID || 'unknown',
        railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || 'production',
        railwayServiceId: process.env.RAILWAY_SERVICE_ID || 'unknown'
      })
    }

    return NextResponse.json(versionInfo)
  } catch (error) {
    console.error('❌ Version API 오류:', error)
    return NextResponse.json(
      { error: '버전 정보를 가져올 수 없습니다' },
      { status: 500 }
    )
  }
}