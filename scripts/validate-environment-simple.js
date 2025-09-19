#!/usr/bin/env node
/**
 * 간단한 환경변수 검증 스크립트
 * npm run validate-env로 실행
 */

function validateEnvironment() {
  console.log('🔍 배포 전 환경변수 검증 시작...\n');

  const errors = [];
  const warnings = [];

  // 1. NODE_ENV 확인
  console.log('1. 환경 설정 확인...');
  const nodeEnv = process.env.NODE_ENV;
  console.log(`   NODE_ENV: ${nodeEnv || '(설정되지 않음)'}`);

  // 2. DATABASE_URL 확인
  console.log('\n2. DATABASE_URL 검증...');
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    errors.push('DATABASE_URL이 설정되지 않음');
  } else if (dbUrl.includes('temp:5432')) {
    errors.push('DATABASE_URL이 임시값 "temp:5432"로 설정됨');
  } else if (dbUrl.includes('localhost')) {
    warnings.push('DATABASE_URL이 localhost로 설정됨 (로컬 개발용)');
  } else {
    console.log('   ✅ DATABASE_URL 설정됨');
    // URL에서 민감한 정보를 숨김
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`   URL: ${maskedUrl.substring(0, 60)}...`);
  }

  // 3. Railway 환경 확인
  console.log('\n3. Railway 환경 확인...');
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  const railwayProject = process.env.RAILWAY_PROJECT_ID;

  if (railwayEnv) {
    console.log(`   ✅ Railway 환경: ${railwayEnv}`);
  } else {
    warnings.push('RAILWAY_ENVIRONMENT가 설정되지 않음');
  }

  // 4. NextAuth 확인
  console.log('\n4. NextAuth 설정 확인...');
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!nextAuthSecret || nextAuthSecret === 'temp') {
    errors.push('NEXTAUTH_SECRET이 설정되지 않았거나 임시값임');
  } else {
    console.log('   ✅ NEXTAUTH_SECRET 설정됨');
  }

  if (nextAuthUrl) {
    console.log(`   ✅ NEXTAUTH_URL: ${nextAuthUrl}`);
  }

  // 5. 결과 출력
  console.log('\n📊 검증 결과:');

  if (warnings.length > 0) {
    console.log('\n⚠️ 경고사항:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ 오류:');
    errors.forEach(error => console.log(`   - ${error}`));

    console.log('\n🔧 해결 방법:');
    console.log('1. Railway 대시보드에서 환경변수 확인');
    console.log('2. DATABASE_URL이 올바른 PostgreSQL URL인지 확인');
    console.log('3. NEXTAUTH_SECRET을 안전한 값으로 설정');
    console.log('4. 배포 후 npm run health-check 실행');

    process.exit(1);
  }

  console.log('✅ 모든 검증 통과!');
  console.log('🚀 배포를 진행할 수 있습니다.');
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };