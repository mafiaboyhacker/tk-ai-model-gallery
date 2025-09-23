# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run dev:backend` - Start backend development server on port 3001
- `npm run build` - Build the application (includes Prisma generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run security-check` - Run security validation
- `npm run pre-deploy` - Run security, lint, and build checks

### Database & Environment
- `npm run validate-env` - Validate environment variables and DB connection
- `npm run health-check` - Check system health status
- `npm run deploy-safe` - Comprehensive pre-deployment validation
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management

### Testing & Deployment
- `npm run deploy-railway` - Deploy to Railway with validation
- `npm run post-deploy` - Post-deployment health check
- `npm run batch-upload` - Batch upload media files

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js with Prisma adapter
- **State Management**: Zustand stores
- **UI Components**: Masonic for virtualized masonry gallery
- **File Storage**: Railway Volume + PostgreSQL metadata
- **Deployment**: Railway platform

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
- **MasonryGallery.tsx** - Main virtualized gallery using Masonic
- **ModelCard.tsx** - Individual media item display
- **VideoPlayer.tsx** - Custom video player component
- **OptimizedImage.tsx** - Performance-optimized image component

#### Gallery Features
- 6-column responsive masonry layout
- Video autoplay with controls
- Modal view for detailed inspection
- Virtualization for performance with large datasets
- Smart ratio-based arrangement (videos prioritized)

### API Architecture

#### Railway Storage API (`/api/railway/storage`)
- `GET ?action=list` - List all media files
- `POST ?action=upload` - Upload new media file
- `DELETE ?id={id}` - Delete specific media file
- `GET /file/{type}/{filename}` - Serve media files

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

#### Deployment Process
1. Run `npm run deploy-safe` for comprehensive validation
2. Use `npm run deploy-railway` for automated deployment
3. Post-deployment health check runs automatically
4. Monitor via `/api/health-check` endpoint

### Environment Configuration

#### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL for NextAuth
- `NODE_ENV` - Environment (development/production)

#### Railway-Specific Configuration
- Automatic environment detection
- Volume-based file storage in `/app/uploads`
- PostgreSQL metadata storage
- Auto-recovery system for deployment issues

## 🚨 Critical Development Rules

### Absolute Prohibitions

#### 1. No New Features
- Never add new functionality, UI elements, or components
- No fallback images, error messages, or alternative UIs
- Preserve existing user experience exactly

#### 2. No UI/UX Changes
- Maintain current design and layout 100%
- Keep 6-column Masonic gallery layout
- Preserve all colors, fonts, spacing, animations
- No visual modifications whatsoever

#### 3. No Functional Changes
- Keep existing behavior unchanged
- Maintain video autoplay, modal interactions, link behavior
- Preserve all user interactions exactly as they are

### Allowed Operations

#### 1. Performance Optimization Only
- Remove console.log statements (production only)
- Prevent memory leaks and unnecessary re-renders
- Optimize API calls and caching
- Improve loading performance

#### 2. Bug Fixes Only
- Fix broken functionality to restore intended behavior
- Prevent errors without adding new UI
- Improve stability and reliability

#### 3. Code Quality Improvements Only
- Enhance type safety
- Improve cleanup functions
- Code organization and optimization

### Development Principle
**Users should only notice "faster and more stable" - visually identical experience**

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

This architecture supports a robust, scalable AI model gallery with dual deployment strategies (local development + Railway production) while maintaining strict optimization-only development constraints.