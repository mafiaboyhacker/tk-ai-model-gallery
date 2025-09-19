# 🛡️ DATABASE_URL 문제 방지 시스템

Railway 배포 시 반복되는 "temp:5432" DATABASE_URL 문제를 자동으로 방지하고 해결하는 종합 시스템입니다.

## 📋 시스템 구성요소

### 1. 환경변수 검증 시스템 (`src/lib/env-validator.ts`)
- DATABASE_URL 유효성 검사
- Railway 환경 감지
- 실시간 PostgreSQL 연결 테스트
- 오류 분석 및 해결책 제안

### 2. 헬스체크 API (`src/app/api/health-check/route.ts`)
- 배포 후 자동 상태 확인
- 환경변수 및 DB 연결 검증
- 상세한 진단 정보 제공
- REST API로 외부 모니터링 지원

### 3. 자동 복구 시스템 (`src/lib/auto-recovery.ts`)
- Prisma 연결 자동 복구
- 환경변수 재로딩
- 전체 시스템 복구 프로세스
- 앱 시작 시 자동 초기화

### 4. 배포 검증 파이프라인 (`scripts/`)
- 배포 전 환경 검증
- 배포 후 헬스체크
- 안전한 Railway 배포 스크립트

## 🚀 사용 방법

### 배포 전 검증
```bash
# 환경변수 및 DB 연결 검증
npm run validate-env

# 전체 배포 준비 상태 확인
npm run deploy-safe
```

### 안전한 배포
```bash
# 종합 검증 + 자동 배포 + 헬스체크
npm run deploy-railway
```

### 배포 후 확인
```bash
# 수동 헬스체크
npm run health-check

# 웹 헬스체크 API
curl https://ai-model-gallery.railway.app/api/health-check
```

## 📊 API 엔드포인트

### GET `/api/health-check`
배포 후 시스템 상태를 종합적으로 확인합니다.

**응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "responseTime": 245,
  "environment": {
    "nodeEnv": "production",
    "isRailway": true,
    "railwayService": "ai-model-gallery"
  },
  "validation": {
    "environmentVariables": {
      "valid": true,
      "errors": [],
      "warnings": [],
      "fixes": []
    },
    "database": {
      "connected": true,
      "url": "postgresql://postgres:***@containers-us-west-1...",
      "issue": null,
      "suggestedFix": null
    }
  }
}
```

## 🔧 자동 복구 기능

### 앱 시작 시 자동 실행
- 프로덕션 환경에서만 활성화
- 5초 후 자동 복구 시도
- 비동기 실행으로 앱 시작 차단 없음

### 복구 단계
1. **환경변수 검증**: DATABASE_URL, NEXTAUTH_SECRET 등 확인
2. **환경변수 재로딩**: Railway 환경변수 강제 갱신
3. **Prisma 연결 복구**: 새로운 클라이언트로 연결 테스트
4. **최종 헬스체크**: 전체 시스템 상태 확인

## ⚠️ 문제 해결 가이드

### DATABASE_URL "temp:5432" 오류
```bash
# 1. 환경변수 확인
npm run validate-env

# 2. 수동 복구 시도
node -e "require('./src/lib/auto-recovery').AutoRecoverySystem.performFullRecovery()"

# 3. Railway 환경변수 재설정
# Railway 대시보드에서 DATABASE_URL 값 확인
```

### 배포 실패 시
```bash
# 1. 배포 전 검증 실행
npm run validate-env

# 2. 로컬 빌드 테스트
npm run build

# 3. 안전 배포 스크립트 사용
npm run deploy-railway
```

### 헬스체크 실패 시
```bash
# 1. 수동 헬스체크
npm run health-check

# 2. Railway 로그 확인
# https://railway.app/dashboard -> 프로젝트 -> Deployments -> Logs

# 3. 환경변수 검증
npm run validate-env
```

## 📈 모니터링 및 알림

### 상태 모니터링
- 헬스체크 API 주기적 호출 (권장: 5분 간격)
- Railway 대시보드 메트릭 확인
- 로그 모니터링을 통한 자동 복구 추적

### 알림 설정 (선택사항)
```javascript
// Slack/Discord 알림 예시 (auto-recovery.ts 116라인에 추가 가능)
if (!recovered) {
  // 여기서 Slack/Discord 알림 등을 보낼 수 있음
  await sendSlackNotification('배포 후 자동 복구 실패');
}
```

## 🧪 테스트 가이드

### 로컬 테스트
```bash
# 환경변수 검증 테스트
NODE_ENV=production npm run validate-env

# 헬스체크 API 테스트 (서버 실행 중)
curl http://localhost:3000/api/health-check
```

### 프로덕션 테스트
```bash
# 배포 후 자동 헬스체크
npm run health-check

# 웹 브라우저에서 확인
open https://ai-model-gallery.railway.app/api/health-check
```

## 📝 유지보수

### 정기 점검 항목
- [ ] 헬스체크 API 응답 확인 (주 1회)
- [ ] Railway 환경변수 상태 점검 (월 1회)
- [ ] 자동 복구 로그 검토 (월 1회)
- [ ] 배포 스크립트 성공률 모니터링

### 업데이트 시 확인사항
- [ ] `src/lib/env-validator.ts` 환경변수 검증 로직
- [ ] `src/app/api/health-check/route.ts` 응답 형식
- [ ] `scripts/deploy-railway.js` 배포 단계
- [ ] Railway 환경변수 설정 동기화

## 🎯 시스템 목표

✅ **재발 방지**: 같은 DATABASE_URL 문제 반복 방지
✅ **자동 복구**: 수동 개입 없이 문제 해결
✅ **조기 감지**: 배포 전 문제 발견
✅ **투명성**: 상세한 진단 정보 제공
✅ **안정성**: 프로덕션 환경 안정성 보장

이 시스템으로 **"왜 할때마다 이런문제가 생기는거지?"** 문제를 근본적으로 해결합니다.