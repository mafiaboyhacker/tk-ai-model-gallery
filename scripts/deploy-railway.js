#!/usr/bin/env node
/**
 * Railway 안전 배포 스크립트
 * npm run deploy-railway로 실행 또는 node scripts/deploy-railway.js
 */

const { execSync } = require('child_process');
const { validateEnvironment } = require('./validate-environment-simple');
const { performHealthCheck } = require('./health-check');

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} 완료`);
  } catch (error) {
    console.error(`❌ ${description} 실패:`, error.message);
    process.exit(1);
  }
}

async function deployToRailway() {
  console.log('🚀 Railway 안전 배포 프로세스 시작...\n');

  try {
    // 1. 배포 전 검증
    console.log('📋 1단계: 배포 전 검증');
    await validateEnvironment();

    // 2. 코드 품질 검사
    console.log('\n🔍 2단계: 코드 품질 검사');
    runCommand('npm run lint', 'ESLint 코드 검사');

    // 3. 빌드 테스트
    console.log('\n🔨 3단계: 빌드 테스트');
    runCommand('npm run build', '프로덕션 빌드');

    // 4. Git 상태 확인
    console.log('\n📦 4단계: Git 상태 확인');
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (gitStatus.trim()) {
        console.log('⚠️ 커밋되지 않은 변경사항이 있습니다:');
        console.log(gitStatus);

        console.log('\n📝 변경사항을 커밋합니다...');
        runCommand('git add .', 'Git 스테이징');
        runCommand('git commit -m "fix: Railway 빌드 실패 해결 - 자동 복구 시스템 추가\n\n🔧 프로덕션 환경에서 DATABASE_URL 문제 재발 방지:\n- 환경변수 검증 시스템\n- 자동 헬스체크 API\n- 배포 후 자동 복구 로직\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"', 'Git 커밋');
      } else {
        console.log('✅ Git 상태 깨끗함');
      }
    } catch (error) {
      console.warn('⚠️ Git 상태 확인 실패, 계속 진행...');
    }

    // 5. Railway 배포
    console.log('\n🚂 5단계: Railway 배포');
    runCommand('git push origin main', 'Railway로 배포');

    // 6. 배포 완료 대기
    console.log('\n⏳ 6단계: 배포 완료 대기');
    console.log('Railway 빌드가 완료될 때까지 대기 중...');

    // Railway 빌드 시간을 고려한 대기 (일반적으로 2-5분)
    const buildWaitTime = 90; // 90초
    for (let i = buildWaitTime; i > 0; i -= 10) {
      process.stdout.write(`\r⏱️  ${i}초 후 헬스체크 시작... `);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    console.log('\n');

    // 7. 배포 후 헬스체크
    console.log('🏥 7단계: 배포 후 헬스체크');

    let healthCheckAttempts = 0;
    const maxAttempts = 5;

    while (healthCheckAttempts < maxAttempts) {
      try {
        await performHealthCheck();
        break; // 성공하면 루프 종료
      } catch (error) {
        healthCheckAttempts++;
        if (healthCheckAttempts >= maxAttempts) {
          console.error(`❌ ${maxAttempts}번의 헬스체크 모두 실패`);
          console.error('Railway 대시보드에서 로그를 확인하세요:');
          console.error('https://railway.app/dashboard');
          process.exit(1);
        }

        console.warn(`⚠️ 헬스체크 실패 (${healthCheckAttempts}/${maxAttempts}), 30초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    // 8. 배포 성공
    console.log('\n🎉 배포 성공!');
    console.log('📊 배포 정보:');
    console.log(`   - 시간: ${new Date().toLocaleString('ko-KR')}`);
    console.log(`   - URL: ${process.env.NEXTAUTH_URL || 'https://ai-model-gallery.railway.app'}`);
    console.log(`   - 관리자: ${process.env.NEXTAUTH_URL || 'https://ai-model-gallery.railway.app'}/admin`);
    console.log(`   - 헬스체크: ${process.env.NEXTAUTH_URL || 'https://ai-model-gallery.railway.app'}/api/health-check`);

  } catch (error) {
    console.error('\n🚨 배포 실패:', error.message);
    console.error('\n🔧 문제 해결 단계:');
    console.error('1. Railway 대시보드에서 로그 확인: https://railway.app/dashboard');
    console.error('2. 환경변수 확인: npm run validate-env');
    console.error('3. 로컬 빌드 테스트: npm run build');
    console.error('4. 수동 헬스체크: npm run health-check');
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  deployToRailway();
}

module.exports = { deployToRailway };