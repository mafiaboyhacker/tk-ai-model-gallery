const { PrismaClient } = require('@prisma/client');

async function checkDB() {
  console.log('=== PostgreSQL 연결 테스트 ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 없음');

  const prisma = new PrismaClient();

  try {
    // 기본 연결 테스트
    await prisma.$connect();
    console.log('✅ Prisma 연결 성공');

    // 간단한 쿼리 테스트
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ PostgreSQL 버전:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);

    // 테이블 확인
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('📊 테이블 수:', tables.length);

    // Media 테이블이 있다면 레코드 수 확인
    try {
      const mediaCount = await prisma.media.count();
      console.log('📄 Media 레코드 수:', mediaCount);

      if (mediaCount > 0) {
        const recent = await prisma.media.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { fileName: true, createdAt: true }
        });
        console.log('📅 최근 업로드:', recent.fileName, recent.createdAt);
      }
    } catch (e) {
      console.log('ℹ️  Media 테이블 접근 오류 (스키마 문제일 수 있음)');
    }

  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:');
    console.error('   오류:', error.message);
    console.error('   코드:', error.code);
    if (error.meta) {
      console.error('   메타:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();