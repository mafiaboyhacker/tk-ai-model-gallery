# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application (includes Prisma DB push and generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Playwright E2E tests
- `npm run test:headed` - Run tests with browser UI
- `npm run test:ui` - Run tests in interactive UI mode

### Database & Environment
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management
- `npm run validate-env` - Validate environment variables and DB connection

### Testing & Deployment
- `npm run deploy-safe` - Comprehensive pre-deployment validation
- `npm run deploy-railway` - Deploy to Railway with validation
- `npm run post-deploy` - Post-deployment health check

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with React 19 (with optimizeCss enabled)
- **Database**: PostgreSQL with Prisma ORM (v6.15.0)
- **Styling**: Tailwind CSS v4 with PostCSS
- **Authentication**: NextAuth.js with Prisma adapter
- **State Management**: Zustand stores
- **UI Components**: Masonic for virtualized masonry gallery
- **File Storage**: Railway Volume + PostgreSQL metadata
- **Media Processing**: Sharp for images, FFmpeg for videos
- **Testing**: Playwright for E2E testing
- **Deployment**: Railway platform with Railpack build system

### Key Directories Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   └── model/             # Model detail pages
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   └── MasonryGallery.tsx # Main gallery component
├── lib/                   # Utilities and configurations
│   ├── prisma.ts          # Database connection
│   ├── auth.ts            # NextAuth configuration
│   └── env-validator.ts   # Environment validation
├── store/                 # Zustand state stores
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Database Architecture

The application uses two main approaches for media storage:

1. **Legacy AIModel System** (Prisma schema) - Complex model with categories, industries, and full metadata
2. **Simplified Media System** (Railway Volume) - Streamlined approach with file storage + PostgreSQL metadata

Key models:
- `Media` - Core media files with metadata (current system)
- `AIModel` - Legacy complex model system
- `User` - Authentication and admin access
- `Inquiry` - 4-step inquiry system for model licensing

### State Management Architecture

#### Environment Store Pattern
The app uses a unified environment detection system:
- `useEnvironmentStore` - Detects Railway vs Local environment
- `useRailwayMediaStore` - Railway-specific media operations
- `useImageStore` - Legacy local media store

#### Key Stores
- **railwayMediaStore.ts** - Primary media store for Railway deployment
- **imageStore.ts** - Legacy local development store
- **environmentStore** - Environment detection and switching

### Media Gallery System

#### Core Components
- **MasonryGallery.tsx** - Main virtualized gallery using Masonic with advanced hooks integration
- **SafeModelCard.tsx** - Individual media item display with Chrome stability fixes
- **OptimizedImage.tsx** - Performance-optimized image component
- **VideoPlayer.tsx** - Custom video player component

#### Gallery Features
- 6-column responsive masonry layout with dynamic column calculation
- Video autoplay when in viewport with Intersection Observer (50px rootMargin)
- Modal view for detailed inspection
- Advanced Masonic virtualization with hooks (usePositioner, useContainerPosition, useScroller, useResizeObserver)
- Smart ratio-based arrangement (videos prioritized)
- Chrome stability fixes with reduced intersection observer complexity

### Mobile Navigation System

#### Responsive Design
- **Desktop**: Right-aligned navigation (MODEL, VIDEO, CONTACT)
- **Mobile**: Hamburger menu with slide-out drawer
- **Breakpoint**: `md:hidden` for mobile-only elements

#### Mobile Menu Features
- Left-side hamburger button with animation (3-line to X transformation)
- Slide-out menu with backdrop overlay
- Categories: MODEL, VIDEO, CONTACT with icons
- Auto-close on selection and outside click

### API Architecture

#### Railway Storage API (`/api/railway/storage`)
- `GET ?action=list` - List all media files with caching
- `POST ?action=upload` - Upload with optional video/image processing
- `DELETE ?id={id}` - Delete specific media file
- `DELETE ?action=clear-all` - Delete all media files
- `DELETE ?action=clear-images` - Delete only images
- `DELETE ?action=clear-videos` - Delete only videos
- `GET /file/{type}/{filename}` - Serve media files
- `GET ?action=sync` - DB-filesystem synchronization
- `GET ?action=health` - Storage system health check

#### Video Processing System
- **VideoProcessor.ts** - FFmpeg-based video compression and optimization
- **Progress API** (`/api/railway/storage/progress`) - Server-Sent Events for real-time progress
- **VideoProcessingModal.tsx** - User interface for video processing options
- **Features**: Compression, thumbnail generation, preview clips, metadata extraction

#### Processing Options
- **Image Processing**: Sharp-based resizing (max 1600x900), WebP conversion (85% quality), thumbnail generation (320px)
- **Video Processing**: FFmpeg compression, thumbnail extraction, preview generation, metadata extraction
- **Supported Formats**:
  - Images: .jpg, .jpeg, .png, .webp, .gif (auto-converted to WebP)
  - Videos: .mp4, .webm, .mov (with automatic compression and thumbnail generation)
- **Fallback**: Original file storage if processing fails

#### Health & Validation APIs
- `/api/health-check` - System health status
- `/api/health` - Basic health endpoint
- `/api/version` - Application version info

### Authentication System

- **NextAuth.js** with Prisma adapter
- **Credential-based** authentication with bcrypt
- **Role-based access** (USER, ADMIN, SUPER_ADMIN)
- **Admin dashboard** protected routes

### Performance Optimizations

#### Current Optimizations
- Font optimization (reduced from 8 to 4 font files)
- Masonic virtualization for large galleries
- Image lazy loading and optimization
- Service Worker registration
- Debounced resize handlers
- Memoized components to prevent unnecessary re-renders

#### Memory Management
- Cleanup functions in useEffect hooks
- Proper disposal of object URLs
- Virtualization to handle large datasets

### Development Workflow

#### Local Development
1. Ensure PostgreSQL connection (local or Railway)
2. Run `npm run validate-env` to check environment
3. Use `npm run dev` for development server
4. Admin access via `/admin` route (requires authentication)
5. Use `npm test` to run E2E tests during development

#### Deployment Process
1. Run `npm run deploy-safe` for comprehensive validation
2. Use `npm run deploy-railway` for automated deployment
3. Post-deployment health check runs automatically
4. Monitor via `/api/health-check` endpoint

#### Build Troubleshooting
- If encountering "Cannot find module 'critters'" error, ensure `critters` is in dependencies (not devDependencies)
- CSS optimization (`optimizeCss: true`) requires critters package in production builds
- Use `npm run build` locally to test Railway deployment builds

#### Common Issues and Solutions

**Masonic Gallery Issues:**
- **Images not appearing initially**: Ensure `allMedia` doesn't return empty array before mount; use higher initial `overscanBy` value (15 for unmounted state)
- **SSR errors with ResizeObserver**: Make `useResizeObserver` conditional: `const resizeObserver = mounted ? useResizeObserver(positioner) : null`
- **Video autoplay issues**: Check Intersection Observer configuration and `isVideoInView` state management

**Video Processing Issues:**
- **"비디오를 재생할 수 없습니다" error**: Usually indicates FFmpeg not available or video processing failed
- **FFmpeg installation**: Ensure `nixpacks.toml` is properly configured with `nixPkgs = ["...", "ffmpeg"]`
- **Video upload but no thumbnail**: Check FFmpeg installation and VideoProcessor.checkFFmpegInstallation() result

**Performance Issues:**
- **Chrome stability**: Use SafeModelCard with reduced intersection observer complexity and throttled video events
- **Memory leaks**: Ensure proper cleanup in useEffect hooks and disposal of object URLs
- **Large datasets**: Utilize Masonic virtualization with dynamic overscanBy calculation

### Environment Configuration

#### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL for NextAuth
- `NODE_ENV` - Environment (development/production)

#### Railway-Specific Configuration
- Automatic environment detection via Railpack build system
- Volume-based file storage in `/app/uploads`
- PostgreSQL metadata storage
- FFmpeg installation via nixpacks configuration for video processing
- Auto-recovery system for deployment issues

### Critical Development Rules

#### File Management Rules

**Backup Folder Policy**
- **ai-model-gallery-backup/** folder is for reference ONLY
- **NEVER commit or push the backup folder to Git**
- Use backup files for understanding legacy implementations
- Do not copy code from backup without thorough review

#### Git Exclusions
- Always exclude: `.env*`, `node_modules/`, `.next/`, `.railway/`
- Never commit sensitive data or build artifacts
- Use `.gitignore` to prevent accidental commits

### Code Modification Guidelines

#### Allowed Operations
- Performance optimization and bug fixes
- Video/image processing improvements
- Mobile responsiveness enhancements
- API efficiency improvements
- Memory leak prevention

#### UI/UX Consistency
- Maintain 6-column masonry gallery layout
- Preserve video autoplay behavior
- Keep mobile hamburger menu functionality
- Maintain responsive design patterns

### Development Principle
**Enhance functionality and performance while preserving user experience**

## Common Patterns

### Error Handling
The codebase uses comprehensive error handling with:
- try/catch blocks with detailed logging
- Environment-specific error messages
- Auto-recovery systems for deployment issues
- Health check APIs for monitoring

### State Management Pattern
```typescript
// Zustand store pattern used throughout
export const useStore = create<StoreInterface>((set, get) => ({
  // State
  data: [],
  isLoading: false,

  // Actions with error handling
  loadData: async () => {
    set({ isLoading: true })
    try {
      // Implementation
    } catch (error) {
      // Error handling
    } finally {
      set({ isLoading: false })
    }
  }
}))
```

### Component Patterns
- Use `memo()` for performance optimization
- Implement proper cleanup in useEffect
- Follow established naming conventions
- Maintain TypeScript interfaces consistency

### API Response Pattern
```typescript
// Standard API response format
{
  success: boolean
  data?: any
  error?: string
  timestamp?: string
}
```

This architecture supports a robust, scalable AI model gallery with comprehensive media processing capabilities, mobile-first responsive design, and Railway deployment optimization. The system balances feature richness with performance while maintaining clean separation between development and production environments.