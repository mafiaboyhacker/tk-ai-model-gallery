# AI 모델 갤러리 파일 서빙 시스템 완전 복구 명세서

## ⚠️ 중요: 작업 완료 후 이 파일을 삭제하세요
```bash
rm AI_GALLERY_RECOVERY_PLAN.md
```

## 🎯 프로젝트 정보
- **경로**: `C:\Users\TK\Documents\llmcode\tkbm\tk_infl2\tk-ai-model-gallery`
- **기술스택**: Next.js 15.5.2, Railway, PostgreSQL, Prisma 6.15.0, Sharp, FFmpeg
- **현재 URL**: https://tk-ai-model-gallery-production-0d55.up.railway.app (404 에러)
- **Repository**: https://github.com/mafiaboyhacker/tk-ai-model-gallery.git

## 🔍 현재 문제점 분석

### 주요 이슈
1. **Railway 웹서비스 404 에러** - 배포 실패 또는 빌드 문제
2. **Volume 마운트 실패** - `/data` 경로 접근 불가 (`directoryExists: false`)
3. **파일 서빙 실패** - 업로드된 이미지/비디오 404 에러
4. **갤러리 표시 안됨** - 업로드 후 웹페이지에 미디어 출력 안됨

### 성공한 부분
- ✅ 미드저니 배치 방식 구현 완료 (직접 import, 동적 로딩 제거)
- ✅ 16:9~9:16 종횡비 자동 감지 시스템
- ✅ 이미지/비디오 처리 파이프라인 (Sharp, FFmpeg)
- ✅ PostgreSQL 메타데이터 저장

## 🚀 6단계 구현 계획

### **Phase 1: Railway 서비스 복구 (우선순위: 최고)**
**목표**: 웹서비스 404 에러 해결

**구현 방법**:
1. Railway 서비스 상태 확인: `railway status`
2. 빌드 로그 분석: `railway logs --tail 50`
3. 필요시 재배포: `railway up --detach`
4. 환경변수 및 의존성 확인
5. Next.js 빌드 에러 수정

### **Phase 2: Volume 마운트 대안 구현 (우선순위: 높음)**
**목표**: 하이브리드 스토리지 시스템 구축

**구현 방법**:
```typescript
// 환경 감지 및 저장 경로 결정
const getStoragePath = () => {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return process.env.RAILWAY_VOLUME_MOUNT_PATH // /data
  }
  return '/tmp/uploads' // Railway ephemeral storage
}

// 파일 크기 기반 저장 전략
const hybridStorage = async (file: Buffer, size: number) => {
  if (size < 1024 * 1024) { // 1MB 미만
    return await storeInDatabase(file, metadata) // Base64 DB 저장
  } else {
    return await storeInFileSystem(file, metadata) // Filesystem 저장
  }
}
```


### **Phase 3: 파일 서빙 시스템 재구축 (우선순위: 높음)**
**목표**: API 기반 파일 서빙 구축

**구현 방법**:
```typescript
// app/api/media/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const media = await prisma.media.findUnique({
    where: { id: params.id }
  })

  // DB에서 직접 서빙 (Base64 디코딩)
  if (media.storageType === 'database' && media.fileData) {
    const buffer = Buffer.from(media.fileData, 'base64')
    return new Response(buffer, {
      headers: {
        'Content-Type': media.mimeType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  }

  // 파일시스템에서 서빙
  const filePath = path.join(getStoragePath(), media.fileName)
  const file = await readFile(filePath)
  return new Response(file, { ... })
}
```

### **Phase 4: 갤러리 UI 이미지 경로 수정 (우선순위: 중간)**
**목표**: 파일 경로를 API 엔드포인트로 변경

**구현 방법**:
```typescript
// store/railwayMediaStore.ts 수정
const convertedMedia = rawMedia.map(item => ({
  ...item,
  url: `/api/media/${item.id}`, // 변경: 직접 파일 경로 → API
  thumbnailUrl: `/api/media/${item.id}/thumbnail`,
  originalUrl: `/api/media/${item.id}/original`
}))
```

### **Phase 5: 데이터베이스 스키마 확장 (우선순위: 중간)**
**목표**: 하이브리드 스토리지 지원 필드 추가

**구현 방법**:
```prisma
model Media {
  id          String   @id @default(cuid())
  fileName    String
  mimeType    String?
  fileSize    Int?

  // 새 필드들
  fileData    String?  @db.Text  // Base64 인코딩된 파일 데이터
  storageType String   @default("filesystem") // "database" | "filesystem"
  thumbnailData String? @db.Text // 썸네일 데이터

  // 기존 필드들...
}
```

### **Phase 6: 성능 최적화 (우선순위: 낮음)**
**목표**: 캐싱 및 성능 개선

**구현 방법**:
- 이미지 CDN 연동 (Vercel/Cloudinary)
- Redis 캐싱 시스템
- 썸네일 우선 → 원본 지연 로드

## 🎯 성공 기준

### 필수 달성 목표
1. **웹사이트 정상 접근** (HTTP 200 응답)
2. **이미지 업로드 → 즉시 갤러리 표시**
3. **비디오 업로드 → 썸네일과 함께 표시**
4. **모든 파일 404 에러 해결**
5. **16:9~9:16 종횡비 적절한 배치**

### 검증 방법
1. 웹사이트 접속 테스트
2. 관리자 페이지에서 이미지/비디오 업로드
3. 업로드 즉시 메인 갤러리에 표시 확인
4. 다양한 종횡비 이미지 배치 테스트
5. 모바일/데스크탑 반응형 확인

## 🛠 핵심 파일 경로

### 수정 대상 파일들
- `src/app/api/railway/storage/route.ts` - 업로드 API
- `src/store/railwayMediaStore.ts` - 미디어 스토어
- `src/components/MasonryGallery.tsx` - 갤러리 UI
- `prisma/schema.prisma` - DB 스키마
- `railway.toml` - Railway 설정

### 새로 생성할 파일
- `src/app/api/media/[id]/route.ts` - 파일 서빙 API
- `src/app/api/media/[id]/thumbnail/route.ts` - 썸네일 API

## 🔧 실행 명령어
다음 명령어로 이 계획을 실행하세요:
```
/implement "AI 모델 갤러리 파일 서빙 시스템 완전 복구 및 최적화" --wave-mode force --persona-architect --persona-backend --persona-devops --focus infrastructure --validate --ultrathink --seq --c7 --all-mcp --uc
```

## ⚠️ 중요사항
- 각 Phase는 순차적으로 실행하되, 의존성을 고려하여 병렬 처리 가능
- 모든 변경사항은 git commit 후 Railway 자동 배포
- 실패 시 rollback 전략 준비
- **작업 완료 후 반드시 이 MD 파일을 삭제하세요**

---
*이 파일은 AI 갤러리 시스템 완전 복구를 위한 종합 가이드입니다.*
*모든 구현이 완료되면 삭제하세요.*