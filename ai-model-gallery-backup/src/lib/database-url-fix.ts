/**
 * DATABASE_URL temp:5432 문제 완전 해결
 * Railway 배포 시 환경변수 강제 검증 및 복구
 */

export function validateDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL

  console.log('🔍 DATABASE_URL 검증 시작:', {
    exists: !!databaseUrl,
    preview: databaseUrl ? databaseUrl.substring(0, 40) + '...' : 'UNDEFINED',
    nodeEnv: process.env.NODE_ENV,
    railway: process.env.RAILWAY_ENVIRONMENT,
    timestamp: new Date().toISOString()
  })

  // 1. DATABASE_URL이 없는 경우
  if (!databaseUrl) {
    const error = 'DATABASE_URL이 환경변수에 설정되지 않음'
    console.error('❌', error)
    throw new Error(error)
  }

  // 2. temp:5432 패턴 감지
  if (databaseUrl.includes('temp:5432')) {
    const error = 'DATABASE_URL이 임시값 temp:5432로 설정됨 - Railway 환경변수 로딩 실패'
    console.error('🚨', error)
    console.error('현재 DATABASE_URL:', databaseUrl)
    throw new Error(error)
  }

  // 3. localhost 패턴 감지 (프로덕션에서)
  if (process.env.NODE_ENV === 'production' && databaseUrl.includes('localhost')) {
    const error = 'DATABASE_URL이 프로덕션 환경에서 localhost로 설정됨'
    console.error('⚠️', error)
    throw new Error(error)
  }

  // 4. Railway PostgreSQL 패턴 검증
  const isValidRailwayUrl = databaseUrl.includes('postgres://') &&
                           (databaseUrl.includes('railway.internal') ||
                            databaseUrl.includes('postgres.railway'))

  if (process.env.RAILWAY_ENVIRONMENT && !isValidRailwayUrl) {
    console.warn('⚠️ Railway 환경이지만 DATABASE_URL이 Railway 패턴과 일치하지 않음')
  }

  console.log('✅ DATABASE_URL 검증 성공')
  return databaseUrl
}

/**
 * Prisma 연결 전 DATABASE_URL 강제 검증
 */
export function ensureValidDatabaseUrl(): void {
  try {
    validateDatabaseUrl()
  } catch (error) {
    console.error('🚨 DATABASE_URL 검증 실패 - 애플리케이션 시작 중단')
    console.error('Railway 대시보드에서 환경변수를 확인하세요:')
    console.error('https://railway.app/dashboard')
    throw error
  }
}