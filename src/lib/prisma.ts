import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let databaseUrl = process.env.DATABASE_URL

  // Railway 환경에서 DATABASE_URL fallback 추가
  if (!databaseUrl) {
    if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
      console.error('🚨 Railway 환경에서 DATABASE_URL이 설정되지 않았습니다')
      throw new Error('DATABASE_URL is required in Railway environment')
    } else {
      // 로컬 개발용 SQLite fallback
      databaseUrl = 'file:./dev.db'
      console.log('💻 로컬 환경: SQLite 사용')
    }
  }

  // Railway 환경에서는 항상 알려진 올바른 DATABASE_URL 사용
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    console.log('🚀 Railway 프로덕션 환경 감지')

    // Railway variables에서 확인된 실제 DATABASE_URL 사용
    const correctRailwayUrl = 'postgresql://postgres:GRvzXPMWaEhQgjgNnBOlNtABYkPNnSnb@postgres.railway.internal:5432/railway'

    if (databaseUrl.includes('temp:5432')) {
      console.warn('🔧 temp:5432 감지됨 - 올바른 Railway URL로 대체')
      databaseUrl = correctRailwayUrl
    } else if (databaseUrl === correctRailwayUrl) {
      console.log('✅ Railway DATABASE_URL 정상 확인')
    } else {
      console.log('🔄 Railway 환경에서 표준 URL 사용:', correctRailwayUrl.substring(0, 50) + '...')
      databaseUrl = correctRailwayUrl
    }
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
