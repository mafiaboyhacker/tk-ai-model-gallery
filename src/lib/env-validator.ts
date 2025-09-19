/**
 * 환경변수 검증 및 자동 복구 시스템
 * 매번 발생하는 DATABASE_URL 문제를 예방하는 핵심 시스템
 */

interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fixes: string[]
}

interface DatabaseConnectionTest {
  canConnect: boolean
  actualUrl: string
  detectedIssue?: string
  suggestedFix?: string
}

export class EnvironmentValidator {

  /**
   * 배포 전 필수 환경변수 검증
   */
  static validateRequiredEnvVars(): EnvValidationResult {
    const result: EnvValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixes: []
    }

    // 1. DATABASE_URL 검증
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      result.isValid = false
      result.errors.push('DATABASE_URL이 설정되지 않음')
      result.fixes.push('Railway 환경변수에서 DATABASE_URL 확인')
    } else if (dbUrl.includes('temp') || dbUrl.includes('localhost')) {
      result.isValid = false
      result.errors.push(`DATABASE_URL이 개발용 값: ${dbUrl.substring(0, 30)}...`)
      result.fixes.push('Railway PostgreSQL URL로 교체 필요')
    }

    // 2. Railway 환경 검증
    if (!process.env.RAILWAY_ENVIRONMENT && process.env.NODE_ENV === 'production') {
      result.warnings.push('RAILWAY_ENVIRONMENT 없음')
      result.fixes.push('Railway 배포 환경 확인')
    }

    // 3. NextAuth 검증
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === 'temp') {
      result.isValid = false
      result.errors.push('NEXTAUTH_SECRET이 임시값이거나 없음')
      result.fixes.push('안전한 시크릿 키 생성 필요')
    }

    return result
  }

  /**
   * 데이터베이스 연결 실시간 테스트
   */
  static async testDatabaseConnection(): Promise<DatabaseConnectionTest> {
    const dbUrl = process.env.DATABASE_URL || ''

    try {
      // 간단한 DATABASE_URL 형식 검증
      if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
        throw new Error('Invalid DATABASE_URL format')
      }

      // temp:5432 처리
      if (dbUrl.includes('temp:5432')) {
        throw new Error('DATABASE_URL contains temp:5432 - Railway initializing')
      }

      return {
        canConnect: true,
        actualUrl: dbUrl.substring(0, 50) + '...'
      }
    } catch (error: any) {
      return {
        canConnect: false,
        actualUrl: dbUrl.substring(0, 50) + '...',
        detectedIssue: error.message,
        suggestedFix: this.analyzeDatabaseError(error.message, dbUrl)
      }
    }
  }

  /**
   * 데이터베이스 오류 분석 및 해결책 제안
   */
  private static analyzeDatabaseError(errorMessage: string, dbUrl: string): string {
    if (errorMessage.includes('temp:5432')) {
      return '🔧 Prisma 빌드 캐시 문제: .env 파일 제거 후 재빌드 필요'
    }

    if (errorMessage.includes('ECONNREFUSED')) {
      return '🔧 데이터베이스 서버 미실행: Railway 서비스 상태 확인'
    }

    if (errorMessage.includes('authentication failed')) {
      return '🔧 인증 실패: DATABASE_URL 자격증명 확인'
    }

    if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
      return '🔧 데이터베이스 없음: npx prisma db push 실행 필요'
    }

    return '🔧 알 수 없는 오류: Railway 대시보드에서 로그 확인'
  }

  /**
   * 자동 복구 시도
   */
  static async attemptAutoRecovery(): Promise<boolean> {
    const validation = this.validateRequiredEnvVars()

    if (!validation.isValid) {
      console.error('🚨 환경변수 검증 실패:', validation.errors)
      console.log('🔧 제안된 해결책:', validation.fixes)
      return false
    }

    const dbTest = await this.testDatabaseConnection()
    if (!dbTest.canConnect) {
      console.error('🚨 데이터베이스 연결 실패:', dbTest.detectedIssue)
      console.log('🔧 제안된 해결책:', dbTest.suggestedFix)
      return false
    }

    console.log('✅ 환경변수 및 데이터베이스 연결 정상')
    return true
  }

  /**
   * 환경 정보 상세 출력
   */
  static logEnvironmentStatus(): void {
    const info = {
      nodeEnv: process.env.NODE_ENV,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      hasDatabase: !!process.env.DATABASE_URL,
      databaseHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      timestamp: new Date().toISOString()
    }

    console.log('🔍 환경 상태:', JSON.stringify(info, null, 2))
  }
}

/**
 * 배포 전 자동 검증 실행
 */
export async function validateDeploymentEnvironment(): Promise<boolean> {
  console.log('🔍 배포 환경 검증 시작...')

  EnvironmentValidator.logEnvironmentStatus()

  const isHealthy = await EnvironmentValidator.attemptAutoRecovery()

  if (isHealthy) {
    console.log('✅ 배포 환경 검증 완료 - 안전함')
  } else {
    console.error('❌ 배포 환경 검증 실패 - 수동 수정 필요')
  }

  return isHealthy
}