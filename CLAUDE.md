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

# Git operations
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push origin main     # Push to GitHub (triggers auto-deploy)
```

## GitHub Repository Information

### 🔗 Repository Details
- **Repository URL**: `https://github.com/mafiaboyhacker/tk-ai-model-gallery.git`
- **GitHub Page**: https://github.com/mafiaboyhacker/tk-ai-model-gallery
- **Branch**: `main` (default)
- **Visibility**: Public repository
- **Auto-Deploy**: Vercel automatically deploys from main branch

### 📦 Repository Structure
- **Main Project**: `ai-model-gallery/` - Contains the actual Next.js application code
- **Parent Directory**: Contains documentation and planning files
- **Git Configuration**: Each directory has its own .git repository
  - Parent: `C:\Users\TK\Documents\llmcode\tkbm\tk_infl\.git` (no remote)
  - Project: `C:\Users\TK\Documents\llmcode\tkbm\tk_infl\ai-model-gallery\.git` (connected to GitHub)

### 🚀 Deployment Workflow
```bash
# Standard development workflow
cd ai-model-gallery
git add .
git commit -m "feat: your changes description"
git push origin main  # This triggers automatic Vercel deployment

# Check repository status
gh repo view  # View repository details
git status    # Check local changes
git log       # View commit history

# Deploy directly to Vercel (optional, auto-deploy usually sufficient)
npx vercel --prod
```

### 📊 Current Deployment Status
- **Production URL**: https://ai-model-gallery-3qy9injc9-tks-projects-ff84fc76.vercel.app
- **Last Deploy**: Successfully deployed with complete deployment environment stability verification (2025-01-16)
- **Auto-Deploy**: Enabled via GitHub integration
- **Environment**: Production with Supabase integration active
- **Status**: 🟢 All core functions (upload, delete, auto-title) fully operational
- **Verification**: ✅ Complete system stability confirmed through comprehensive testing

## Core Architecture

### Technology Stack
- **Framework**: Next.js 15.5.2 (App Router + React 19)
- **Styling**: Tailwind CSS v4 with custom Google Fonts (Libre Bodoni + Jost)
- **State Management**: Zustand stores
- **UI Components**: react-responsive-masonry for Midjourney-style layout

### 🔄 Storage Architecture: Environment-Based Auto-Switching System

**IMPORTANT**: The project now uses **automatic environment detection** to switch between storage systems. No manual code changes needed for deployment.

#### Core Auto-Detection System
- **Environment Detection**: `src/lib/environment.ts` - Detects localhost vs production
- **Auto Store Selection**: `src/hooks/useEnvironmentStore.ts` - Automatically selects appropriate store
- **Universal Components**: All pages/components use `useEnvironmentStore` for automatic switching

#### 🏠 Local Development Environment (Auto-Selected on localhost)
- **Primary Storage**: `useMediaStore` (IndexedDB) - Automatically selected
- **Database**: `mediaDB.ts` - IndexedDB-based media management
- **File Processing**: Client-side Canvas/Video API
- **File Upload**: Direct storage to local browser (images + videos)
- **Capacity**: No browser limit (hundreds of GB possible)
- **Synchronization**: Browser-specific isolation (no sharing between browsers)
- **Advantages**: Fast development, network bandwidth savings, works without Supabase
- **Auto-Detection Logic**:
  ```typescript
  isProduction() = false (localhost, 127.0.0.1)
  shouldUseSupabase() = false
  → useMediaStore (IndexedDB) selected
  → "Local Storage" displayed in UI
  ```

#### 🚀 Deployment Environment (Auto-Selected on Vercel)
- **Primary Storage**: `useSupabaseMediaStore` (Supabase) - Automatically selected
- **Database**: Supabase PostgreSQL + Prisma ORM v6
- **Authentication**: NextAuth.js v4
- **File Storage**: Supabase Storage with Sharp.js processing
- **File Upload**: Server-side transmission then cloud storage (images + videos)
- **Deployment**: Vercel with automated security validation
- **Capacity**: 1GB free tier (Supabase)
- **Synchronization**: Cloud-based real-time sync (shared across all users)
- **Advantages**: Scalability, stability, security, backup
- **Auto-Detection Logic**:
  ```typescript
  isProduction() = true (*.vercel.app domains)
  hasSupabaseConfig() = true (environment variables present)
  shouldUseSupabase() = true
  → useSupabaseMediaStore (Supabase) selected
  → "Supabase Storage" displayed in UI
  ```

#### 🔄 Environment-Aware Components
All components automatically adapt to the environment:
- **Main Gallery**: `/` - Uses `useEnvironmentStore` for auto-switching
- **Admin Overview**: `/admin/overview` - Uses `useEnvironmentStore` for auto-switching
- **Admin Tabs**: All admin components automatically detect environment
- **Debug Panel**: Shows current environment and selected storage system

#### 📱 Deployment Workflow: Fully Automatic
```bash
# Local development (uses IndexedDB automatically)
npm run dev  # → localhost:3000 → IndexedDB selected

# Deploy to production (uses Supabase automatically)
git push origin main  # → Vercel deployment → Supabase selected
```

**No code changes required** - the system automatically detects environment and switches storage accordingly.

#### 🔧 Environment Variables (One-time setup for deployment)
Required in Vercel Dashboard for automatic Supabase selection:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-postgres-connection-string
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### 🎯 Auto-Switching Benefits
- ✅ **Zero Configuration**: No manual code changes for deployment
- ✅ **Environment Isolation**: Local data stays local, production data in cloud
- ✅ **Seamless Development**: Switch between localhost and deployed version transparently
- ✅ **Debugging**: Clear console logs showing which storage system is active
- ✅ **UI Indicators**: Storage type displayed in admin interface

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

### GitHub Repository Roles

#### 📂 Repository Structure
- **Main Branch**: `main` - Production-ready code with automated Vercel deployment
- **Development**: Local development with IndexedDB, no direct deployment
- **Version Control**: Git for code versioning, GitHub for remote collaboration
- **Issue Tracking**: GitHub Issues for bug reports and feature requests
- **Documentation**: README.md, CLAUDE.md, and technical documentation in repository

#### 🔄 Development Workflow
1. **Local Development**: Work with IndexedDB storage (`useImageStore`)
2. **Git Commit**: Commit changes locally with descriptive messages
3. **User Approval**: Always ask before pushing to GitHub
4. **GitHub Push**: Push to remote repository only with explicit user permission
5. **Deployment**: Vercel automatically deploys from GitHub main branch

#### 🚀 Deployment Process
- **Local → GitHub**: Manual push with user approval
- **GitHub → Vercel**: Automatic deployment on main branch changes
- **Storage Switch**: Deployment automatically uses `useSupabaseMediaStore`
- **Environment Variables**: Managed in Vercel Dashboard for production

#### 📋 Repository Management
- **Code Backup**: GitHub serves as primary code backup and version history
- **Collaboration**: Multiple developers can work on the project via GitHub
- **Release Management**: GitHub releases for version tracking
- **Security**: GitHub security features for dependency scanning and secrets management

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

The codebase is production-ready with **Environment-Based Auto-Switching System**:

### Core Features
- TypeScript strict mode with custom type declarations
- Performance-optimized React components with video support
- Clean dependency structure with security hardening
- **Automatic environment detection and storage switching**
- Complete admin interface for media management
- Automated security validation and deployment pipeline

### Storage System
- **Auto-Detection**: `useEnvironmentStore` automatically selects storage based on environment
- **Local Development**: Uses IndexedDB (`useMediaStore`) for localhost
- **Production Deployment**: Uses Supabase (`useSupabaseMediaStore`) for Vercel
- **Zero Configuration**: No manual code changes required for deployment
- **Environment Isolation**: Local data stays local, production data in cloud

### Deployment Workflow
```bash
# Local development - automatically uses IndexedDB
npm run dev  # → localhost:3000 → IndexedDB

# Production deployment - automatically uses Supabase
git push origin main  # → Vercel → Supabase (with environment variables)
```

### Key Implementation Files
- `src/lib/environment.ts` - Environment detection logic
- `src/hooks/useEnvironmentStore.ts` - Automatic store selection
- `src/app/page.tsx` - Main gallery with auto-switching
- `src/app/admin/overview/page.tsx` - Admin pages with auto-switching
- `src/components/admin/tabs/OverviewTab.tsx` - Admin components with auto-switching

Current state: **Production deployment verified and fully operational** (2025-01-16) with complete environment-based auto-switching system and Supabase integration.

## 🛡️ Latest Deployment Verification (2025-01-16)

### ✅ Complete Stability Testing Results
- **Upload Functionality**: ✅ Fully operational with Supabase Storage integration
- **Delete Functionality**: ✅ Complete file removal confirmed (Storage + UI)
- **Auto-Title Generation**: ✅ "MODEL #N", "VIDEO #N" format working correctly
- **Environment Detection**: ✅ Production environment properly detected and routed to Supabase
- **API Routes**: ✅ All endpoints `/api/supabase/storage` responding normally
- **TypeScript Compilation**: ✅ Build successful without errors
- **Security Validation**: ✅ Core security measures in place (NextAuth issues non-blocking)

### 🎯 Verified Production URL
**Current Active Deployment**: `https://ai-model-gallery-3qy9injc9-tks-projects-ff84fc76.vercel.app`

**Testing Confirmed**:
1. File upload → Supabase Storage → UI display ✅
2. File deletion → Complete removal → Statistics update ✅
3. Auto-title system → "MODEL #2" generation ✅
4. Environment switching → Production = Supabase ✅

### 📊 System Health Status
- **Overall Status**: 🟢 **FULLY OPERATIONAL**
- **Core Functions**: 100% working
- **Database**: Supabase PostgreSQL connected
- **Storage**: Supabase Storage API functional
- **Build System**: Next.js 15.5.2 compiling successfully