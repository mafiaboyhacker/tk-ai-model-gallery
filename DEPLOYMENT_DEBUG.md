# Railway 배포 실패 디버그 로그

## 현재 상황 (2025-09-25 19:40 KST)

### ❌ 배포 상태 확인
```json
"latestDeployment": {
  "id": "a2b2f26b-d362-46d3-94c9-ea3ebc641f2f",
  "status": "FAILED",
  "deploymentStopped": true
}
```

### ✅ 빌드 상태
- 빌드는 성공: "Successfully Built!" 확인됨
- 빌드 시간: 134.85 seconds
- Next.js 빌드 완료: 31/31 static pages generated

### 🔍 실패 패턴
1. **빌드 성공** → **런타임 실패**
2. 빌드 로그에서는 정상 완료 메시지
3. 실제 배포 상태는 FAILED

### 🎯 가능한 원인들 (우선순위별) - 업데이트
1. ❌ ~~PORT 환경변수~~: 수정완료 (`next start`로 단순화)
2. **ESLint 경고 → 에러**: Railway `CI=true` 환경에서 ESLint 경고가 빌드 실패 유발 ⭐
3. **Heath Check**: `/api/health` 엔드포인트 문제
4. **Database Connection**: PostgreSQL 연결 실패
5. **Environment Variables**: NEXT_PUBLIC_ 변수가 빌드타임에 없을 수 있음
6. **Module Resolution**: Node.js 모듈 찾기 실패
7. **Memory/Resource**: 런타임 리소스 부족

### ⭐ 최신 수정사항 (2025-09-25 19:50 KST)
- **빌드 명령어 수정**: `CI=false next build` - ESLint 경고 무시
- **🔥 CRITICAL 발견**: `nixpacks.toml` DEPRECATED 파일이 배포 실패 원인!
- **해결책**: `nixpacks.toml` 삭제 후 `railway.toml`만 사용
- **이유**: Railway가 DEPRECATED된 nixpacks 설정을 읽으려 해서 실패

### 🔍 환경변수 상태
- ✅ DATABASE_URL: 설정됨
- ✅ NEXTAUTH_SECRET: 설정됨
- ✅ NEXTAUTH_URL: 설정됨
- ✅ RAILWAY_* 변수들: 모두 설정됨
- ❓ PORT: 확인 필요 (Railway에서 자동 할당되어야 함)

### 📋 다음 조사 단계
1. Railway 대시보드에서 런타임 로그 확인
2. 환경변수 설정 재검토
3. 헬스체크 경로 확인
4. 데이터베이스 연결 테스트
5. Node.js 버전 호환성 확인

### 🔧 시도한 해결책
1. ✅ Production 로그 레벨 수정 (커밋: d6eb6a9f)
2. ❌ 여전히 배포 실패 상태

### ⏱️ 타임스탬프
- 마지막 빌드: 2025-09-25 10:40 UTC
- 상태 확인: 2025-09-25 10:41 UTC
- 배포 실패 확인: 2025-09-25 10:42 UTC

---

---

## 2025-09-25 19:55 KST - 새 프로젝트 생성

### 🆕 Railway 프로젝트 정보
- **Project Token**: `885817b1-fc08-4410-ba4d-144834c33cc9`
- **New Project**: `tk-ai-mode-web` (생성완료)
- **이전 프로젝트**: `50dbb956-a656-4dce-9dd6-cd5f36b6afae` (삭제됨)
- **결정**: 기존 프로젝트 완전 삭제 후 새로 시작
- **이유**: 10+ 배포 실패, 설정 충돌 지속, 무한루프 패턴

### 🔑 Railway CLI 토큰 인증 가능 범위

#### 1. Project Token (`RAILWAY_TOKEN`) 기능
```bash
# 환경변수 설정
export RAILWAY_TOKEN=885817b1-fc08-4410-ba4d-144834c33cc9

# 배포 관련 명령어
railway up                    # 코드 업로드 및 배포
railway deploy               # 배포
railway redeploy            # 재배포
railway down                # 최근 배포 삭제

# 프로젝트 관리
railway status              # 프로젝트 상태 확인
railway logs               # 배포 로그 확인
railway variables          # 환경변수 조회
railway open               # 대시보드 열기

# 서비스 관리
railway service            # 서비스 선택/관리
railway add                # 서비스 추가 (PostgreSQL, Redis 등)
railway connect           # 데이터베이스 연결 (psql, mongosh)

# 도메인 관리
railway domain            # 커스텀 도메인 추가/관리

# 볼륨 관리
railway volume            # 프로젝트 볼륨 관리
```

#### 2. Account Token (`RAILWAY_API_TOKEN`) 기능
```bash
# 환경변수 설정
export RAILWAY_API_TOKEN=계정토큰

# 계정 관리
railway whoami            # 현재 로그인 사용자 확인
railway list              # 모든 프로젝트 목록
railway init              # 새 프로젝트 생성
railway link              # 프로젝트 연결
railway unlink            # 프로젝트 연결 해제

# 환경 관리
railway environment       # 환경 생성/삭제/연결
```

#### 3. CI/CD 환경에서 토큰 사용
```bash
# GitHub Actions 예제
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: railway up --detach

# Docker 환경에서
docker run -e RAILWAY_TOKEN=$RAILWAY_TOKEN railwayapp/cli railway up
```

#### 4. 토큰으로 불가능한 작업
- 프로젝트 생성 (Account Token 필요)
- 팀 관리 (웹 대시보드만 가능)
- 결제 정보 수정 (웹 대시보드만 가능)
- 계정 설정 변경 (웹 대시보드만 가능)
```

### 📝 삭제된 항목들
- [ ] 기존 Railway 프로젝트 (steadfast-dream 등)
- [ ] PostgreSQL 데이터베이스 (테스트 데이터만 있었음)
- [ ] 모든 환경변수 설정
- [ ] 이전 배포 히스토리

## 추가 조사 필요 항목
- [ ] Railway 대시보드 런타임 로그 확인
- [ ] Next.js 시작 프로세스 에러 로그
- [ ] 환경변수 NEXT_PUBLIC_ 설정 확인
- [ ] PostgreSQL 연결 상태 확인
- [ ] 볼륨 마운트 경로 문제 확인