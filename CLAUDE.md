# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on http://0.0.0.0:3000
- `npm run build` - Build application (includes Prisma generation)
- `npm run start` - Start production server with automatic DB push
- `npm run lint` - Run ESLint
- `npm test` - Run Playwright E2E tests
- `npm run test:headed` - Run tests with browser UI
- `npm run test:ui` - Run tests in interactive UI mode

### Database Commands
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push --accept-data-loss` - Push schema to database
- `npx prisma studio` - Open Prisma Studio for database management

### Deployment & Validation
- `npm run deploy-safe` - Comprehensive pre-deployment validation
- `npm run validate-env` - Validate environment variables
- `npm run health-check` - Check application health
- `npm run security-check` - Run security validation

### Railway-Specific Commands
- `railway up` - Deploy to Railway platform
- `railway logs` - View deployment logs
- `railway variables` - View/set environment variables
- `railway status` - Check service status

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with React 19 and App Router
- **Database**: PostgreSQL with Prisma ORM v6.15.0
- **Authentication**: NextAuth.js with Prisma adapter
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand stores
- **File Storage**: Railway Volume mounted at `/data`
- **Media Processing**: Sharp (images) + FFmpeg (videos)
- **Gallery**: Masonic virtualized masonry layout
- **Testing**: Playwright for E2E testing
- **Deployment**: Railway platform with Railpack build system

### Database Architecture

**Dual Storage Strategy**:
1. **Legacy AIModel System** - Complex model with categories, industries, full metadata
2. **Simplified Media System** - Current approach with Railway Volume + PostgreSQL metadata

**Key Models**:
- `Media` - Primary media storage (id, fileName, title, type, fileSize, etc.)
- `AIModel` - Legacy complex system with categorization
- `User` - Authentication with role-based access (USER, ADMIN, SUPER_ADMIN)
- `Inquiry` - 4-step inquiry system for model licensing

**Hybrid Storage Pattern**:
- Files <1MB: Base64 encoded in `Media.fileData` field
- Files >1MB: Stored in Railway Volume at `/data/uploads`
- Metadata always stored in PostgreSQL

### Media Processing Pipeline

**Image Processing (ImageProcessor.ts)**:
- Sharp-based processing with automatic fallback
- Resize to max 1600x900, WebP conversion at 85% quality
- Thumbnail generation (480px width)
- Graceful degradation when Sharp unavailable

**Video Processing (VideoProcessor.ts)**:
- FFmpeg-based compression and optimization
- Thumbnail extraction, preview generation
- Metadata extraction (duration, resolution)
- Progress tracking via Server-Sent Events

**Processing Flow**:
1. Upload → 2. Size detection → 3. Database or filesystem storage → 4. Optional processing → 5. Metadata storage

### Railway-Specific Architecture

**Critical Configuration**:
- Volume mount: `/data` (RAILWAY_VOLUME_MOUNT_PATH="/data")
- Build command: `npx prisma generate && npm run build`
- Start command: `npm run start` (includes DB push)
- Health check: `/api/health` endpoint

**Storage Structure**:
```
/data/uploads/
├── images/     # Processed images
├── videos/     # Processed videos
├── thumbnails/ # Generated thumbnails
└── temp/       # Temporary processing files
```

**Environment Detection**:
- `useEnvironmentStore` - Automatic Railway vs Local detection
- `useRailwayMediaStore` - Railway-specific media operations
- API endpoints dynamically adapt to environment

### Gallery System Architecture

**MasonryGallery.tsx**:
- Advanced Masonic implementation with hooks
- WeakMap-safe object handling for virtualization
- 6-column responsive layout with smart aspect ratio handling
- Dynamic overscan calculation based on screen size

**Key Features**:
- Video autoplay with 50px Intersection Observer margin
- Chrome stability fixes with reduced observer complexity
- Empty state handling (loading/filtered/truly empty)
- URL validation for hybrid storage compatibility

**Performance Optimizations**:
- Virtualization handles 1000+ items efficiently
- Memoized components prevent unnecessary re-renders
- Debounced resize handlers
- Progressive image loading

### API Architecture

**Core Storage API** (`/api/railway/storage`):
- `GET ?action=list` - List media with caching
- `POST ?action=upload` - Upload with processing
- `DELETE ?id={id}` - Delete specific media
- `DELETE ?action=clear-all` - Bulk deletion
- `GET ?action=sync` - DB-filesystem synchronization

**Media Serving** (`/api/media/[id]`):
- Dynamic routing for hybrid storage
- Automatic format detection and optimization
- Thumbnail generation on-demand
- Fallback strategies for missing files

**Health & Monitoring**:
- `/api/health` - Application health check
- `/api/health-check` - Detailed system status
- `/api/version` - Version information

## Development Guidelines

### File Management Rules

**Critical Path Requirements**:
- Railway Volume MUST be mounted at `/data`
- Environment variable `RAILWAY_VOLUME_MOUNT_PATH="/data"` required
- PostgreSQL connection required for metadata storage
- Sharp and FFmpeg available in Railway Railpack environment

**Storage Decision Logic**:
- Files <1MB → Database storage (Base64 in `Media.fileData`)
- Files >1MB → Filesystem storage in `/data/uploads`
- Always store metadata in PostgreSQL `Media` table

### Environment Configuration

**Required Environment Variables**:
```bash
DATABASE_URL="postgresql://..."          # PostgreSQL connection
NEXTAUTH_SECRET="..."                   # NextAuth.js secret
NEXTAUTH_URL="https://..."             # Application URL
NODE_ENV="production"                   # Environment
RAILWAY_VOLUME_MOUNT_PATH="/data"      # Volume mount path (CRITICAL)
```

**Railway Volume Configuration**:
```toml
# railway.toml
[[mounts]]
source = "uploads-volume"
target = "/data"
```

### Development Patterns

**State Management Pattern**:
```typescript
// Zustand store with Railway awareness
export const useRailwayMediaStore = create<RailwayMediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  loadMedia: async () => {
    // API call with fallback handling
  }
}))
```

**API Response Pattern**:
```typescript
// Standard API response format
{
  success: boolean
  data?: any
  error?: string
  timestamp?: string
}
```

**Error Handling**:
- Try/catch with detailed logging
- Graceful degradation for missing dependencies
- Environment-specific error messages
- Auto-recovery for deployment issues

### Common Issues & Solutions

**Railway Deployment Issues**:
- **Volume not mounted**: Check `RAILWAY_VOLUME_MOUNT_PATH="/data"` environment variable
- **DB connection fails**: Verify PostgreSQL service status, may need recreation
- **Files disappear on refresh**: Volume mount issue, files saving to `/tmp` instead of `/data`
- **Build succeeds but healthcheck fails**: Usually environment variable or DB connection issue

**Media Processing Issues**:
- **Sharp not available**: Automatic fallback to original files
- **FFmpeg missing**: Videos upload but processing fails, check Railway environment
- **Large file uploads**: 500MB limit enforced, with proper error messages

**Gallery Performance Issues**:
- **Masonic virtualization errors**: Check WeakMap-safe object handling
- **Chrome stability**: Use SafeModelCard with reduced intersection observer complexity
- **Memory leaks**: Ensure proper cleanup in useEffect hooks

### Testing Strategy

**E2E Testing with Playwright**:
- Cross-browser testing (Chrome, Firefox, Safari)
- Upload workflow testing
- Gallery interaction testing
- Mobile responsiveness validation

**Health Check Integration**:
- API endpoint validation
- Database connection testing
- File system access verification
- Environment variable validation

### Security Considerations

**File Upload Security**:
- File type validation (images: jpg/png/webp, videos: mp4/webm/mov)
- File size limits (500MB max)
- Sanitized file naming
- No executable file uploads

**Authentication**:
- Role-based access control
- Admin-only upload permissions
- Secure session management with NextAuth.js

**Data Protection**:
- No sensitive data in logs
- Environment variable validation
- Database credential security

### Performance Guidelines

**Image Optimization**:
- Automatic WebP conversion for modern browsers
- Progressive JPEG for compatibility
- Responsive image serving
- Lazy loading implementation

**Video Optimization**:
- Automatic compression with FFmpeg
- Thumbnail generation for previews
- Streaming-friendly formats
- Progressive download support

**Gallery Performance**:
- Virtualization for large datasets
- Debounced scroll/resize handlers
- Memoized component rendering
- Efficient state updates

### Mobile Responsiveness

**Navigation System**:
- Desktop: Right-aligned navigation
- Mobile: Hamburger menu with slide-out drawer
- Responsive breakpoints with Tailwind CSS
- Touch-friendly interaction targets

**Gallery Adaptation**:
- Column count: 2-6 based on screen width
- Touch gesture support
- Optimized image sizes for mobile
- Reduced complexity for performance

This architecture supports a robust, scalable AI model gallery with comprehensive media processing, mobile-first responsive design, and Railway deployment optimization while maintaining clean separation between development and production environments.