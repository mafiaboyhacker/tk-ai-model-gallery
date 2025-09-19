/**
 * 배포 후 자동 헬스체크 API
 * Railway 배포 완료 즉시 환경변수 및 DB 연결 상태 검증
 */

import { NextRequest, NextResponse } from 'next/server'
import { EnvironmentValidator } from '@/lib/env-validator'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🏥 헬스체크 시작:', new Date().toISOString())

    // 1. 환경변수 검증
    const envValidation = EnvironmentValidator.validateRequiredEnvVars()

    // 2. 데이터베이스 연결 테스트
    const dbTest = await EnvironmentValidator.testDatabaseConnection()

    // 3. 전체 환경 상태 로깅
    EnvironmentValidator.logEnvironmentStatus()

    const healthStatus = {
      status: envValidation.isValid && dbTest.canConnect ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
        railwayService: process.env.RAILWAY_SERVICE_NAME
      },
      validation: {
        environmentVariables: {
          valid: envValidation.isValid,
          errors: envValidation.errors,
          warnings: envValidation.warnings,
          fixes: envValidation.fixes
        },
        database: {
          connected: dbTest.canConnect,
          url: dbTest.actualUrl,
          issue: dbTest.detectedIssue,
          suggestedFix: dbTest.suggestedFix
        }
      },
      deployment: {
        version: process.env.npm_package_version || 'unknown',
        buildTime: process.env.BUILD_TIME || 'unknown',
        commitSha: process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 8) || 'unknown'
      }
    }

    // 4. 문제 발견 시 알림
    if (!envValidation.isValid || !dbTest.canConnect) {
      console.error('🚨 헬스체크 실패:', healthStatus)

      return NextResponse.json(healthStatus, {
        status: 503,
        headers: {
          'X-Health-Status': 'unhealthy',
          'X-Recovery-Needed': 'true'
        }
      })
    }

    console.log('✅ 헬스체크 성공:', healthStatus.status)

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('🚨 헬스체크 중 오류:', error)

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      suggestion: '수동 환경 검증 필요'
    }, {
      status: 500,
      headers: {
        'X-Health-Status': 'error'
      }
    })
  }
}