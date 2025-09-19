#!/usr/bin/env node
/**
 * 배포 전 환경변수 검증 스크립트
 * npm run validate-env로 실행
 */

// TypeScript 파일을 직접 실행하기 위한 동적 import
async function loadEnvironmentValidator() {
  try {
    // Next.js 프로젝트에서 TypeScript 모듈 로드
    const module = await import('../src/lib/env-validator.js');
    return module.EnvironmentValidator;
  } catch (error) {
    console.error('모듈 로드 실패. 빌드가 필요할 수 있습니다.');
    console.error('npm run build를 먼저 실행해주세요.');
    process.exit(1);
  }
}

async function validateEnvironment() {
  console.log('🔍 배포 전 환경변수 검증 시작...\n');

  try {
    const EnvironmentValidator = await loadEnvironmentValidator();

    // 1. 환경변수 검증
    console.log('1. 환경변수 검증...');
    const envValidation = EnvironmentValidator.validateRequiredEnvVars();

    if (!envValidation.isValid) {
      console.error('❌ 환경변수 검증 실패:');
      envValidation.errors.forEach(error => console.error(`   - ${error}`));
      console.log('\n🔧 제안된 해결책:');
      envValidation.fixes.forEach(fix => console.log(`   - ${fix}`));
      process.exit(1);
    }

    if (envValidation.warnings.length > 0) {
      console.warn('⚠️ 경고사항:');
      envValidation.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    console.log('✅ 환경변수 검증 통과');

    // 2. 데이터베이스 연결 테스트
    console.log('\n2. 데이터베이스 연결 테스트...');
    const dbTest = await EnvironmentValidator.testDatabaseConnection();

    if (!dbTest.canConnect) {
      console.error('❌ 데이터베이스 연결 실패:');
      console.error(`   - ${dbTest.detectedIssue}`);
      console.log(`🔧 제안된 해결책: ${dbTest.suggestedFix}`);
      process.exit(1);
    }

    console.log('✅ 데이터베이스 연결 성공');

    // 3. 환경 정보 출력
    console.log('\n3. 환경 정보:');
    EnvironmentValidator.logEnvironmentStatus();

    console.log('\n🎉 모든 검증 완료 - 배포 가능한 상태입니다!');

  } catch (error) {
    console.error('🚨 검증 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };