# 🚂 Railway 배포 가이드

**TK AI 모델 갤러리** Railway 배포 완전 자동화 가이드

## 🎯 즉시 배포 가능

현재 프로젝트는 Railway 배포에 완벽하게 최적화되어 있습니다.

### ⚡ 5분 배포 프로세스

1. **Railway 계정 생성**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **프로젝트 연결**
   ```bash
   # Railway CLI 설치 (선택사항)
   npm install -g @railway/cli
   railway login
   ```

3. **자동 배포**
   - "New Project" → "Deploy from GitHub repo"
   - `mafiaboyhacker/tk-ai-model-gallery` 선택
   - Railway가 자동으로 감지: Next.js + PostgreSQL

### 🔧 환경변수 설정

Railway 대시보드에서 다음 환경변수 추가:

```env
# Required
DATABASE_URL=postgresql://...  # Railway가 자동 생성
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.railway.app

# Optional (if needed)
NODE_ENV=production
SKIP_VALIDATION=false
```

### 📦 Railway 장점

**무료 한도 (충분함)**:
- 5GB 저장소 (현재 3GB 필요)
- 512MB RAM
- PostgreSQL 데이터베이스
- Custom 도메인 지원

**자동화 기능**:
- GitHub Push → 자동 배포
- Database 마이그레이션 자동 실행
- HTTPS/SSL 자동 설정
- 모니터링 및 로그

### 🔄 마이그레이션 단계

#### 1단계: Railway 환경 준비
```bash
# 로컬에서 Railway 환경 테스트
railway run npm run build
railway run npm start
```

#### 2단계: 데이터 이전 (필요시)
```bash
# Supabase에서 데이터 내보내기
pg_dump $SUPABASE_DATABASE_URL > backup.sql

# Railway로 데이터 가져오기
railway run psql -f backup.sql
```

#### 3단계: 파일 저장소 이전
- Railway Volume으로 파일 업로드
- 또는 Cloudflare R2 연동 (더 저렴)

### 🎛️ Railway vs Supabase 비교

| 기능 | Railway | Supabase |
|------|---------|----------|
| **데이터베이스** | PostgreSQL ✅ | PostgreSQL ✅ |
| **파일 저장소** | Volume 5GB ✅ | Storage 1GB ❌ |
| **자동 배포** | GitHub 연동 ✅ | Manual ❌ |
| **비용** | $0 ✅ | $0 제한적 ❌ |
| **성능** | Excellent ✅ | Good ✅ |

### 🚀 배포 후 확인

1. **사이트 접속**: `https://your-app.railway.app`
2. **데이터베이스 연결**: Prisma Studio 확인
3. **파일 업로드**: Admin 인터페이스 테스트
4. **환경 스위칭**: Production 모드 확인

### ⚠️ 주의사항

- Railway는 GitHub 연동이 필수
- 첫 배포 후 도메인 설정 필요
- 파일 저장소 용량 모니터링 권장

## 🔄 롤백 계획

문제 발생시 Supabase로 즉시 롤백 가능:
1. Vercel 환경변수를 Supabase로 변경
2. DNS 설정 복원
3. 데이터 동기화

**Railway 배포 시작할까요?**