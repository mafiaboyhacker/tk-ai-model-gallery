import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let databaseUrl = process.env.DATABASE_URL

  // Railway 환경에서 DATABASE_URL fallback 추가
  if (!databaseUrl) {
    if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
      // 빌드 시에는 로그 출력하지 않음
      throw new Error('DATABASE_URL is required in Railway environment')
    } else {
      // 로컬 개발용 SQLite fallback
      databaseUrl = 'file:./dev.db'
    }
  }

  // Railway 환경에서는 항상 알려진 올바른 DATABASE_URL 사용
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    // Railway variables에서 확인된 실제 DATABASE_URL 사용
    const correctRailwayUrl = 'postgresql://postgres:GRvzXPMWaEhQgjgNnBOlNtABYkPNnSnb@postgres.railway.internal:5432/railway'

    if (databaseUrl.includes('temp:5432')) {
      databaseUrl = correctRailwayUrl
    } else if (databaseUrl !== correctRailwayUrl) {
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
