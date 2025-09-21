# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**TK AI 모델 갤러리** - Next.js 15.5.2 AI model gallery with Railway PostgreSQL + automatic environment switching.

### Essential Commands
```bash
npm run dev              # Local development (auto-uses IndexedDB)
npm run dev:backend      # Alternative port 3001 if 3000 is in use
npm run build            # Production build + Prisma generation
npm run lint             # Code quality check
npm run security-check   # Security validation
npm run pre-deploy       # Security + lint + build combo
npm run deploy-safe      # Full validation + build ready check
npx prisma generate      # After schema changes
npx prisma db push       # Push schema to Railway database
node --version           # Verify Node.js 22.x.x
npm --version            # Verify npm 10.x.x
railway logs --service tk-ai-model-gallery  # Check deployment logs
```

### Core Concepts
- **Environment Auto-Switching**: Local = IndexedDB, Production = Railway PostgreSQL + Volume
- **Admin-Only Upload**: No user-generated content, batch upload only via admin interface
- **BlurBlur.ai + Midjourney**: Design identity + masonry layout (never fixed grids)
- **Masonic Layout**: High-performance virtualized masonry with responsive columns
- **File Processing**: Automatic metadata extraction from filename patterns (u3934589919, imgvnf, etc.)
- **Dual Storage**: IndexedDB (local dev) and Railway Volume + PostgreSQL (production)

### Directory Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── railway/       # Railway storage endpoints
│   │   ├── models/        # Model CRUD operations
│   │   ├── auth/          # NextAuth authentication
│   │   ├── upload/        # File upload handling
│   │   └── version/       # Deployment version info
│   ├── admin/             # Admin-only pages (auth required)
│   ├── model/             # Model detail pages
│   └── globals.css        # Tailwind + custom fonts
├── components/            # React components
│   ├── admin/             # Admin interface components
│   ├── AdminMasonryGallery.tsx # Main gallery component
│   ├── VideoPlayer.tsx    # Video playback component
│   └── Header.tsx         # Navigation header
├── hooks/                 # Custom hooks
│   ├── useEnvironmentStore.ts  # Auto environment detection
│   └── useHydration.ts    # SSR hydration helper
├── lib/                   # Utilities
│   ├── environment.ts     # Environment detection logic
│   ├── file-parser.ts     # Filename → metadata extraction
│   ├── prisma.ts          # Database client
│   └── auth.ts            # NextAuth configuration
├── store/                 # Zustand state management
│   ├── railwayMediaStore.ts    # Railway production storage
│   └── imageStore.ts           # IndexedDB local storage
└── types/                 # TypeScript type definitions
    └── react-responsive-masonry.d.ts
```

## Common Development Tasks

### Adding a New Component
1. Create in `src/components/[category]/ComponentName.tsx`
2. Use TypeScript with props interface
3. Follow BlurBlur.ai design patterns (white theme, clean UI)
4. Import fonts: `font-vogue` (headings), `font-jost` (body)

### Modifying API Endpoints
1. Edit files in `src/app/api/[endpoint]/route.ts`
2. Use Prisma for database operations
3. Handle both local (IndexedDB) and production (Railway) environments
4. Test with `npm run dev` locally

### Adding Database Fields
1. Update `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push` (for Railway)
4. Update TypeScript interfaces in components

### File Processing Logic
- **Parser**: `src/lib/file-parser.ts` - Extracts metadata from filenames
- **Auto-titles**: "MODEL #1", "VIDEO #1" format
- **Supported**: Images (PNG/JPEG/WebP) + Videos (MP4)
- **Processing**: WebP conversion, thumbnail generation

## API Routes Reference

```
/api/railway/storage     # Railway file upload/download
/api/models             # Model CRUD operations
/api/images             # Image processing
/api/health             # System health check
/api/clear-storage      # Clear local storage
/api/migrate            # Database migrations
/api/version            # 🚀 Deployment version information
```

## System Overview

### Technology Stack
- **Runtime**: Node.js 22 LTS (codename 'Jod') + npm 10.x
- **Framework**: Next.js 15.5.2 (App Router + React 19)
- **Database**: Railway PostgreSQL + Prisma ORM v6
- **Storage**: Railway Volume (production) / IndexedDB (local)
- **State**: Zustand with environment auto-switching
- **UI**: Tailwind CSS v4 + Masonic (high-performance masonry)

### Environment Variables (Railway Dashboard)
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/railway
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=[your-project-id]
NEXTAUTH_SECRET=[your-secret-key]
NEXTAUTH_URL=https://ai-model-gallery.railway.app
```

### Key Business Logic

#### Environment Auto-Detection (`src/lib/environment.ts`)
```typescript
isProduction() // Detects *.railway.app domains
shouldUseRailway() // Checks env vars + production status
→ Auto-selects useRailwayMediaStore vs useMediaStore
```

#### Filename Parsing (`src/lib/file-parser.ts`)
```typescript
// Patterns recognized:
"u3934589919_prompt_uuid_0.png" → AI tool, prompt, series, variation
"social_u3934589919_prompt_1.mp4" → Video with metadata
"generation-uuid.jpeg" → Basic pattern
→ 90% automation target
```

#### Auto-Title Generation
- Images: "MODEL #1", "MODEL #2", etc.
- Videos: "VIDEO #1", "VIDEO #2", etc.
- Incremental numbering based on existing content

#### File Processing Pipeline
The system supports both images and videos with automatic processing:

**Supported Formats**:
- Images: PNG, JPEG, WebP (auto-converted to WebP for optimization)
- Videos: MP4, MOV, AVI (processed with FFmpeg)

**Processing Steps**:
1. File validation (type, size, format)
2. Metadata extraction from filename patterns
3. Automatic title generation
4. Storage organization (images/ and videos/ directories)
5. Database record creation with full metadata

**Real Data Support**: Based on analysis of 601 real files, supporting patterns like:
- `u3934589919_prompt_uuid_0.png` (83% of files)
- `social_u3934589919_prompt_1.mp4` (16% of files)
- `generation-uuid.jpeg` (1% of files)

## Development Guidelines

### Critical Rules
1. **Never automatically push to GitHub** - Always ask user permission
2. **Never start dev servers automatically** - Wait for user request
3. **BlurBlur.ai design identity only** - No fixed grids, use masonry layout
4. **Admin-only uploads** - Not user-generated content platform
5. **Performance targets** - <2.5s page load, Core Web Vitals "Good"
6. **Masonic Library Required** - Use Masonic for masonry layout, not react-responsive-masonry
7. **6-Column Layout** - Desktop uses 6 columns (1024px+), 4 columns (768px+), 3 columns (640px+)

### Architecture References
- **Design**: Complete BlurBlur.ai clone (visual identity) - https://blurblur.ai/model/
- **Layout**: Midjourney masonry system (never fixed grids) - https://www.midjourney.com/explore
- **Backend**: Civitai-inspired patterns (database schema, file processing only) - https://github.com/civitai/civitai

### Environment Auto-Detection System
The application automatically detects and switches between environments:

**Local Development**:
- Uses IndexedDB for file storage
- SQLite/PostgreSQL for database (via `DATABASE_URL`)
- All files stored in browser storage

**Railway Production**:
- Uses Railway Volume at `/data` mount point
- PostgreSQL database via Railway addon
- Files organized in `/data/images/` and `/data/videos/`
- Automatic cleanup of IndexedDB to prevent conflicts

### Required Context Documents
Reference these files in the parent directory for detailed specifications:
- `DEVELOPMENT_STRATEGY_MASTER.md` - Core development strategy
- `PRODUCT_REQUIREMENTS_DOCUMENT.md` - Feature specifications
- `blurblur-design-analysis.md` - BlurBlur.ai design system
- `user-image-folder-analysis.md` - Real user data analysis

## Railway CLI 연결 및 배포 관리 (중요!)

### 🚀 Railway CLI 설정 및 연결
```bash
# Railway CLI 확인
railway --version                    # 4.8.0 설치됨
railway whoami                       # kim7804@gmail.com으로 로그인됨

# 프로젝트 연결 (steadfast-dream)
cd ai-model-gallery
railway link --project steadfast-dream  # 프로젝트 연결
railway status                       # 프로젝트 상태 확인

# 실시간 로그 및 디버깅
railway logs --service tk-ai-model-gallery  # 컨테이너 로그
railway variables                    # 환경변수 확인
railway deploy                       # 직접 배포
```

### 📡 배포된 Railway 정보
- **실제 URL**: https://tk-ai-model-gallery-production.up.railway.app/
- **프로젝트명**: steadfast-dream
- **서비스명**: tk-ai-model-gallery
- **환경**: production
- **포트**: Railway 자동 할당 (보통 8080)

### 🔧 Railway 배포 문제 해결 과정 (2025년 9월)
1. **500 Internal Server Error**: `/api/media/route.ts`에서 fetch() → 직접 import로 수정
2. **502 Application failed to respond**: `package.json`의 PORT 환경변수 지원 추가
3. **nixpacks.toml 최적화**: npm ci → npm install --production=false로 변경
4. **설정 파일 충돌 해결**: railway.toml과 nixpacks.toml 중복 → nixpacks.toml만 사용
5. **Initialization 무한 루프**: Railway 2025년 알려진 이슈, 웹 대시보드에서 서비스 재생성 필요
6. **빌드 성공**: Node.js 22, Nixpacks 1.38.0 사용

### ⚠️ 중요: 모르는 것은 웹검색 필수!
```
Railway CLI, nixpacks, 환경변수 설정 등 모르는 내용이 있으면
반드시 WebSearch 도구를 사용해서 최신 정보를 확인하세요!

예시 검색어:
- "Railway CLI project link non-interactive 2025"
- "nixpacks.toml Node.js configuration 2025"
- "Railway environment variables setup 2025"
```

### 🚀 업로드 진행률 표시 기능 (완성)
```typescript
// IndexedDB Store (imageStore.ts)
addMedia: async (files: File[], onProgress?: (progress: number, fileName: string, processed: number) => void)

// Railway Store (railwayMediaStore.ts) - 이미 지원
addMedia: async (files: File[], onProgress?: (progress: number, fileName: string, processed: number) => void)

// 사용법
await store.addMedia(files, (progress, fileName, processed) => {
  console.log(`${progress.toFixed(1)}% - ${fileName}`)
})
```

## Recent Updates

### 🚀 Deployment Version Management System (v1.0.0 - September 2025)
- **Version Tracking**: Real-time deployment version display in admin panel
- **Environment Detection**: Automatic Railway vs Local environment identification
- **Build Information**: Git commit, build date, Node.js version tracking
- **API Endpoint**: `/api/version` - Provides comprehensive deployment metadata
- **Admin Integration**: VersionDisplay component in admin overview page
- **Live Monitoring**: Real-time deployment status and environment verification

#### Version Information Components
```typescript
// 🚀 Admin panel에서 확인 가능한 정보:
- 📦 Version: v1.0.0 (package.json 기반)
- 🕒 Build Date: 실시간 빌드 시간
- 🔗 Git Commit: Railway/Vercel 자동 감지
- 🚀 Platform: Railway/Vercel/Local 자동 인식
- 🌐 Environment: production/development/staging
- 🔧 Node.js: v22.x.x LTS 확인
```

#### Deployment Verification Commands
```bash
# 🚀 로컬에서 버전 확인
curl http://localhost:3000/api/version

# 🌐 Railway 배포 버전 확인
curl https://ai-model-gallery.railway.app/api/version

# 📊 Admin 패널에서 시각적 확인
https://ai-model-gallery.railway.app/admin/overview
```

### Node.js 22 LTS Upgrade (September 2025)
- **Upgraded from**: Node.js >=20.0.0, npm >=8.0.0
- **Upgraded to**: Node.js >=22.0.0, npm >=10.0.0
- **LTS Status**: Active LTS until October 2025, Maintenance until April 2027
- **Performance**: 10-15% improvement with V8 engine optimizations
- **Compatibility**: Fully tested with Next.js 15.5.2, all dependencies compatible
- **Security**: Latest security patches and 3-year support guarantee

#### Verification Commands
```bash
node --version    # Should show v22.x.x
npm --version     # Should show v10.x.x
npm run build     # Confirm build success with new runtime
npm run dev       # Verify development server works
```

#### Benefits Gained
- **Long-term Support**: Guaranteed updates until April 2027
- **Enhanced Performance**: Faster V8 JavaScript execution
- **Modern Features**: Latest ECMAScript and Node.js APIs
- **Security**: Current vulnerability patches and proactive monitoring

## Testing & Validation

### Local Development Testing
```bash
npm run dev                 # Test environment auto-switching
http://localhost:3000       # Verify IndexedDB storage active
http://localhost:3000/admin # Test admin interface
```

### Production Validation
```bash
npm run build              # Check build success
npm run lint               # Verify code quality
npm run pre-deploy         # Full security + quality check
```

### Environment Verification
- **Local**: Console shows "Using IndexedDB storage"
- **Production**: Console shows "Using Railway storage"
- **Admin Panel**: Storage type indicator in interface

## Troubleshooting

### 🚨 Railway 배포 문제 해결

#### Railway CLI 연결 문제
```bash
# 연결 상태 확인
railway whoami                       # 로그인 확인
railway list                         # 프로젝트 목록
railway link --project steadfast-dream  # 재연결

# 연결이 안될 때
rm -rf .railway/                     # 로컬 설정 삭제
railway login                        # 재로그인
```

#### Railway 배포 실패 (502/500 에러)
```bash
# 1. 로그 확인
railway logs --service tk-ai-model-gallery

# 2. 환경변수 확인
railway variables

# 3. PORT 문제 확인
# package.json에 ${PORT:-3000} 환경변수 지원 있는지 확인

# 4. 빌드 실패 시
# nixpacks.toml에서 npm ci → npm install --production=false 변경
```

#### API fetch 에러 (Railway 내부)
```typescript
// ❌ 잘못된 방법 (Railway에서 실패)
const response = await fetch('/api/railway/storage', {...})

// ✅ 올바른 방법 (Railway에서 성공)
const { GET: railwayStorageGET } = await import('../railway/storage/route')
const response = await railwayStorageGET(request)
```

### Common Issues

#### Environment Switching Failed
```typescript
// Check src/lib/environment.ts
isProduction() // Should return false locally, true on Railway
shouldUseRailway() // Should match environment
```

#### Build Errors
```bash
npx prisma generate  # Regenerate client
rm -rf .next         # Clear build cache
npm run build        # Rebuild
```

#### Database Connection Issues
```env
# Verify Railway environment variables
DATABASE_URL=postgresql://...
RAILWAY_ENVIRONMENT=production
```

#### Upload Not Working
1. Check environment detection in console
2. Verify storage permissions (Railway Volume)
3. Check file size limits and formats
4. Ensure admin authentication active

#### Database Schema Information
The project uses a dual-model approach:
- **AIModel**: Full-featured model with categories, industries, processing status
- **Media**: Simplified model for Railway Volume storage (current implementation)

Key models in `prisma/schema.prisma`:
- `User`: Admin authentication and roles
- `Media`: File storage with metadata (used in production)
- `AIModel`: Extended model for future features
- `Inquiry`: 4-step inquiry system from BlurBlur.ai

#### Testing Commands
```bash
# Test local development
npm run dev
curl http://localhost:3000/api/health

# Test environment detection
curl http://localhost:3000/api/version

# Test Railway deployment
curl https://tk-ai-model-gallery-production.up.railway.app/api/version

# Database operations
npx prisma studio          # Open database browser
npx prisma db push         # Push schema changes
npx prisma generate        # Regenerate client
```

### 🔍 모르는 것은 반드시 웹검색!
```bash
# Railway CLI 문제 시
WebSearch: "Railway CLI commands 2025"
WebSearch: "Railway project link troubleshooting"

# nixpacks 빌드 문제 시
WebSearch: "nixpacks.toml Node.js configuration"
WebSearch: "Railway nixpacks build failure"

# 환경변수 문제 시
WebSearch: "Railway environment variables setup"
WebSearch: "Next.js PORT environment variable Railway"
```

### Development Patterns

#### Component Structure
```typescript
interface ComponentProps {
  // Always define props interface
}

export default function Component({ prop }: ComponentProps) {
  // Use TypeScript strict mode
  // Follow BlurBlur.ai design patterns
  // Import fonts: font-vogue, font-jost
}
```

#### Environment-Aware Code
```typescript
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'

function Component() {
  const { currentStore, isProduction } = useEnvironmentStore()
  // Component automatically adapts to environment
}
```