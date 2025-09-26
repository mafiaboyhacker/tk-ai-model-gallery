const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  console.log('=== Railway 데이터베이스 테이블 구조 확인 ===');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:hRJcHCNuDnZKSQuHfcXeEzlvdENsdurp@trolley.proxy.rlwy.net:16385/railway"
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Prisma 연결 성공');

    // 모든 테이블 조회
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 현재 테이블 목록:');
    tables.forEach(table => {
      console.log(`   ${table.table_name} (${table.table_type})`);
    });

    // Media 테이블 존재 여부 확인
    const mediaTableExists = tables.some(table => table.table_name === 'media');
    console.log(`\n📄 Media 테이블: ${mediaTableExists ? '✅ 존재' : '❌ 없음'}`);

    if (!mediaTableExists) {
      console.log('\n🔧 Media 테이블이 없습니다. 생성이 필요합니다.');

      // 수동으로 Media 테이블 생성
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "media" (
            "id" TEXT NOT NULL,
            "fileName" TEXT NOT NULL,
            "originalFileName" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "fileSize" INTEGER NOT NULL,
            "mimeType" TEXT NOT NULL,
            "width" INTEGER,
            "height" INTEGER,
            "duration" DOUBLE PRECISION,
            "resolution" TEXT,
            "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "fileData" TEXT,
            "storageType" TEXT NOT NULL DEFAULT 'filesystem',
            "thumbnailData" TEXT,
            CONSTRAINT "media_pkey" PRIMARY KEY ("id")
          )
        `;
        console.log('✅ Media 테이블 생성 완료');
      } catch (createError) {
        console.error('❌ Media 테이블 생성 실패:', createError.message);
      }
    }

    // AIModel 테이블 확인
    const aiModelExists = tables.some(table => table.table_name === 'ai_models');
    console.log(`📄 AIModel 테이블: ${aiModelExists ? '✅ 존재' : '❌ 없음'}`);

  } catch (error) {
    console.error('❌ 작업 실패:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();