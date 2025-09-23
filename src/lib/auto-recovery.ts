/**
 * 자동 복구 시스템
 * DATABASE_URL 문제 발생 시 자동으로 복구 시도
 */

import { EnvironmentValidator } from './env-validator'

export class AutoRecoverySystem {

  /**
   * Prisma 연결 문제 자동 복구
   */
  static async recoverPrismaConnection(): Promise<boolean> {
    console.log('🔧 Prisma 연결 복구 시도...')

    try {
      // 1. 동적 Prisma 클라이언트 재생성
      const { PrismaClient } = await import('@prisma/client')

      const freshPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        log: ['warn', 'error'],
      })

      // 2. 연결 테스트
      await freshPrisma.$connect()
      await freshPrisma.$queryRaw`SELECT 1`
      await freshPrisma.$disconnect()

      console.log('✅ Prisma 연결 복구 성공')
      return true

    } catch (error: any) {
      console.error('❌ Prisma 연결 복구 실패:', error.message)
      return false
    }
  }

  /**
   * 환경변수 재로딩
   */
  static async reloadEnvironmentVariables(): Promise<boolean> {
    try {
      console.log('🔄 환경변수 재로딩...')

      // Railway 환경에서 환경변수 강제 재로딩
      if (process.env.RAILWAY_ENVIRONMENT) {
        // Railway는 런타임에 환경변수 주입하므로 추가 로딩 불필요
        console.log('✅ Railway 환경변수 확인됨')
        return true
      }

      return false
    } catch (error: any) {
      console.error('❌ 환경변수 재로딩 실패:', error.message)
      return false
    }
  }

  /**
   * 전체 시스템 자동 복구
   */
  static async performFullRecovery(): Promise<boolean> {
    console.log('🚑 전체 시스템 복구 시도...')

    // 1. 환경변수 검증
    const validation = EnvironmentValidator.validateRequiredEnvVars()
    if (!validation.isValid) {
      console.error('❌ 환경변수 검증 실패, 수동 수정 필요')
      return false
    }

    // 2. 환경변수 재로딩
    const envReloaded = await this.reloadEnvironmentVariables()
    if (!envReloaded) {
      console.warn('⚠️ 환경변수 재로딩 실패')
    }

    // 3. Prisma 연결 복구
    const prismaRecovered = await this.recoverPrismaConnection()
    if (!prismaRecovered) {
      console.error('❌ Prisma 연결 복구 실패')
      return false
    }

    // 4. 최종 헬스체크
    const finalCheck = await EnvironmentValidator.attemptAutoRecovery()
    if (finalCheck) {
      console.log('🎉 전체 시스템 복구 완료!')
      return true
    } else {
      console.error('❌ 복구 후에도 문제 지속, 수동 개입 필요')
      return false
    }
  }

  /**
   * 배포 후 자동 복구 트리거
   */
  static async triggerPostDeploymentRecovery(): Promise<void> {
    console.log('🚀 배포 후 자동 복구 트리거...')

    // 5초 대기 (Railway 컨테이너 안정화)
    await new Promise(resolve => setTimeout(resolve, 5000))

    const recovered = await this.performFullRecovery()

    if (recovered) {
      console.log('✅ 배포 후 자동 복구 성공')
    } else {
      console.error('❌ 배포 후 자동 복구 실패')
      // 여기서 Slack/Discord 알림 등을 보낼 수 있음
    }
  }
}

/**
 * Next.js 앱 시작 시 자동 실행
 */
export async function initializeAutoRecovery(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT) {
    console.log('🔧 프로덕션 환경에서 자동 복구 시스템 초기화...')

    // 비동기로 복구 시도 (앱 시작을 차단하지 않음)
    AutoRecoverySystem.triggerPostDeploymentRecovery().catch(error => {
      console.error('🚨 자동 복구 초기화 실패:', error)
    })
  }
}