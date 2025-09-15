# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Language

**IMPORTANT: Always respond in Korean (한국어) when working with this project.** All explanations, comments, and communication should be in Korean unless specifically requested otherwise by the user.

## Project Overview

**TK AI 모델 갤러리** - An AI model gallery website combining BlurBlur.ai's design identity with Midjourney's masonry layout system. Currently in production deployment with Supabase integration and complete security hardening.

## Development Commands

```bash
# Development server with Turbopack
npm run dev              # Always runs on http://localhost:3000
npm run dev:backend      # Backend dev server on port 3001
npm run dev:local        # Local dev server on port 3000

# Production build with Turbopack
npm run build            # Build with Prisma generation

# Start production server
npm start                # Start on port 3000
npm run start:backend    # Start backend on port 3001
npm run start:local      # Start local on port 3000

# Code quality
npm run lint             # ESLint code checking

# Security and deployment
npm run security-check   # Run automated security validation
npm run pre-deploy       # Complete pre-deployment check (security + lint + build)

# Database operations
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open Prisma Studio for database management

# Supabase operations
npx supabase start       # Start local Supabase (requires Docker)
npx supabase status      # Check local Supabase status

# Deployment commands
npx vercel --prod        # Deploy to production
npx vercel env ls        # List environment variables
```

## Core Architecture

### Technology Stack
- **Framework**: Next.js 15.5.2 (App Router + React 19)
- **Styling**: Tailwind CSS v4 with custom Google Fonts (Libre Bodoni + Jost)
- **State Management**: Zustand stores
- **UI Components**: react-responsive-masonry for Midjourney-style layout

### Storage Architecture (로컬 vs 배포)

#### 🏠 로컬 개발 환경 (CURRENT ACTIVE)
- **Primary Storage**: `useImageStore` - IndexedDB (로컬 브라우저 저장소)
- **Database**: `mediaDB.ts` - IndexedDB 기반 미디어 관리
- **File Processing**: 클라이언트 사이드 Canvas/Video API
- **용량**: 브라우저 제한 없음 (수백 GB 가능)
- **동기화**: 브라우저별 독립적
- **사용 위치**:
  - 메인 갤러리: `/`
  - 모델 상세 페이지: `/model/[id]`
  - 어드민 설정: `/admin/settings`
  - 어드민 이미지/비디오 탭

#### 🚀 배포 환경 (DEPLOYMENT READY)
- **Primary Storage**: `useSupabaseMediaStore` - Supabase Storage
- **Database**: Supabase PostgreSQL + Prisma ORM v6
- **Authentication**: NextAuth.js v4
- **File Storage**: Supabase Storage with Sharp.js processing
- **Deployment**: Vercel with automated security validation
- **용량**: 1GB 무료 (Supabase)
- **동기화**: 클라우드 기반 실시간 동기화
- **사용 위치**:
  - 배포시 모든 컴포넌트 교체 필요

#### 🔄 Blob Storage (ALTERNATIVE)
- **Alternative Storage**: `useBlobMediaStore` - Vercel Blob
- **용량**: 별도 요금제
- **사용 목적**: Supabase 대안

### Key System Components

#### Filename Parsing System (`src/lib/file-parser.ts`)
Real user data-driven parsing system based on 601 file analysis:
```typescript
// Recognizes patterns like:
// u3934589919_prompt_uuid_0.png (83% of files)
// social_u3934589919_prompt_uuid_1.mp4 (16% of files)
// generation-uuid.jpeg (1% of files)
// imgvnf_prompt_uuid_2.png
// Auto-extracts: AI tool, prompt, series UUID, variation number
```

#### Database Schema (`prisma/schema.prisma`)
- **AIModel**: Core entity supporting both images and videos
- **User**: Admin authentication with role-based access
- **Inquiry**: 4-step customer inquiry system
- **UploadBatch**: Bulk file processing tracking

#### Storage Architecture
- **`src/store/supabaseMediaStore.ts`**: Primary store for Supabase Storage integration
- **`src/store/imageStore.ts`**: Legacy IndexedDB store (maintained for compatibility)
- **`src/store/blobMediaStore.ts`**: Vercel Blob storage integration
- **`src/lib/supabaseStorage.ts`**: Core Supabase file operations and metadata handling

#### Component Architecture
- **MasonryGallery**: Responsive masonry grid with performance optimizations
- **ModelCard**: Individual model display with loading states (supports both images and videos)
- **AdminModelCard**: Admin-specific card with inline editing and deletion capabilities
- **VideoPlayer**: Custom video player component with autoplay and controls
- **Header**: BlurBlur.ai-inspired navigation with IAXAI branding
- **Admin Interface**:
  - Overview/Images/Videos/Settings tabs
  - Batch upload with drag-and-drop
  - Real-time IndexedDB storage statistics
  - Name editing restricted to admin pages only

### File Processing Pipeline

#### Supported Formats
- **Images**: JPEG, PNG, WebP (with auto-conversion to WebP)
- **Videos**: MP4 with thumbnail generation

#### Metadata Extraction
- Auto-parsing from filename patterns (90% automation target)
- AI generation tool detection
- Series grouping via UUID extraction
- Variation numbering (_0, _1, _2 pattern)

## Architecture Patterns

### Admin-Only Upload System
Not a user-generated content platform - only administrators can upload content through batch processing interface.

### Performance Optimization
- Turbopack enabled for dev and build
- React component optimization with useCallback and debounced resize handlers
- Image loading states and lazy loading
- Performance targets: <2.5s page load, <1s image display

### Design System
- **Typography**: Libre Bodoni (headings) + Jost (body text)
- **Layout**: Masonry grid inspired by Midjourney
- **Branding**: Complete BlurBlur.ai design clone (white theme, clean UI)
- **Responsive**: 6 breakpoints from mobile to 2xl

## Critical Implementation Rules

### Git Workflow Rules
**IMPORTANT**: Git push operations are strictly controlled:
- **NEVER** automatically push changes to GitHub
- **ONLY** push when explicitly requested by the user with commands like:
  - "git push"
  - "push to GitHub"
  - "commit and push"
  - "deploy changes"
- Always commit changes locally, but wait for user approval before pushing
- Ask for confirmation before any push operation

### Development Server Rules
**IMPORTANT**: Development server operations are strictly controlled:
- **NEVER** automatically start background development servers (npm run dev)
- **NEVER** run servers in the background without explicit user request
- **ONLY** start servers when explicitly requested by the user
- The user will handle starting and stopping development servers themselves
- If server commands are needed for debugging, ask for permission first

### Must Never Change
- BlurBlur.ai design identity and white theme
- Masonry grid layout (no fixed grids)
- Admin-only upload system
- Performance targets (<500ms API, Core Web Vitals "Good")

### File Processing Requirements
Based on real data analysis:
- 83% PNG images, 16% MP4 videos, 1% JPEG
- Batch processing for 600+ files
- 40% storage savings through WebP conversion
- Supabase Storage cost optimization (~$0.12/month)

### Security Implementation
- **Environment Security**: Automated credential validation via `scripts/security-check.js`
- **Deployment Security**: Pre-deployment validation with `npm run pre-deploy`
- **Git Security**: Enhanced .gitignore preventing credential exposure
- **Documentation**: `SECURE_DEPLOYMENT_CHECKLIST.md` and `VERCEL_ENV_SETUP_GUIDE.md`

### Architecture References
- **Frontend**: Custom implementation following BlurBlur.ai exactly
- **Backend**: Civitai-inspired patterns (database schema, file processing)
- **Storage**: Supabase-first with fallback to other providers
- **Never copy**: Civitai's UI design (only reference backend logic)

## Development Context

The codebase is production-ready with:
- TypeScript strict mode with custom type declarations
- Performance-optimized React components with video support
- Clean dependency structure with security hardening
- Comprehensive Supabase integration with real-time synchronization
- Complete admin interface for media management
- Automated security validation and deployment pipeline
- Multiple storage backend support (Supabase, IndexedDB, Vercel Blob)

Current state: **Production deployment ready** with complete Supabase integration and security hardening.