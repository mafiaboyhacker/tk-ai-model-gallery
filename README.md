# TK AI Model Gallery

BlurBlur.ai 디자인과 Midjourney 스타일 마사지 레이아웃을 결합한 AI 모델 갤러리 웹사이트

## 🚀 배포 URL

- **메인 사이트**: https://ai-model-gallery.railway.app
- **어드민 페이지**: https://ai-model-gallery.railway.app/admin

## 📦 빠른 배포

### 방법 1: 인터랙티브 배포
```bash
./deploy.bat
```
- 변경사항 확인 및 커밋 메시지 입력
- 단계별 확인 과정

### 방법 2: 빠른 배포 (자동)
```bash
./quick-deploy.bat
```
- 자동 커밋 및 배포
- 사용자 입력 없이 즉시 배포

### 방법 3: 수동 배포
```bash
# 변경사항 커밋
git add .
git commit -m "your message"
git push origin main

# Railway 배포
railway deploy
```

## 🛠 개발 환경

### 로컬 개발 서버 시작
```bash
npm run dev
# 또는
./restart-server.bat
```

### 환경별 스토리지 시스템
- **로컬 개발**: IndexedDB (자동 감지)
- **프로덕션**: Railway PostgreSQL + Volume (자동 감지)

## 🎯 주요 기능

- **자동 제목 생성**: MODEL #1, VIDEO #1 형식
- **환경별 자동 전환**: 로컬/프로덕션 환경 자동 감지
- **TypeScript 타입 안전성**: 완전한 타입 안전성 보장
- **관리자 전용 업로드**: 어드민만 컨텐츠 업로드 가능

## 📊 기술 스택

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Database**: Railway PostgreSQL + Prisma ORM
- **Storage**: Railway Volume
- **Deployment**: Railway

## 🔧 환경 변수

프로덕션 배포를 위해 Railway Dashboard에서 다음 환경변수 설정 필요:

```env
DATABASE_URL=postgresql://user:password@host:port/database
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=your-project-id
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://ai-model-gallery.railway.app
```

## 📈 배포 히스토리

- ✅ 2025-09-17: 자동 제목 생성 기능 배포 완료
- ✅ 2025-09-17: TypeScript 타입 안전성 완전 개선
- ✅ 2025-09-17: 환경별 자동 전환 시스템 구현# Force rebuild - Sat, Sep 20, 2025  1:26:56 AM
