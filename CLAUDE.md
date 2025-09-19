# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**TK AI 모델 갤러리** - Next.js 15.5.2 AI model gallery with Railway PostgreSQL + automatic environment switching.

### Essential Commands
```bash
npm run dev              # Local development (auto-uses IndexedDB)
npm run build            # Production build + Prisma generation
npm run lint             # Code quality check
npx prisma generate      # After schema changes
git push origin main     # Deploy to Railway (with user permission)
```

### Core Concepts
- **Environment Auto-Switching**: Local = IndexedDB, Production = Railway PostgreSQL
- **Admin-Only Upload**: No user-generated content, batch upload only
- **BlurBlur.ai + Midjourney**: Design identity + masonry layout (never fixed grids)
- **Masonic Layout**: High-performance virtualized masonry with 6-column desktop layout
- **Aspect Ratio Optimization**: 16:9 landscape images get minimum 120px height for better visibility

### Directory Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── railway/       # Railway storage endpoints
│   │   ├── models/        # Model CRUD operations
│   │   └── images/        # Image operations
│   ├── admin/             # Admin-only pages
│   └── globals.css        # Tailwind + custom fonts
├── components/            # React components
│   ├── admin/             # Admin interface components
│   ├── gallery/           # Main gallery components
│   └── ui/                # Shared UI components
├── hooks/                 # Custom hooks
│   └── useEnvironmentStore.ts  # Auto environment detection
├── lib/                   # Utilities
│   ├── environment.ts     # Environment detection logic
│   ├── file-parser.ts     # Filename → metadata extraction
│   └── prisma.ts          # Database client
└── store/                 # Zustand state management
    ├── railwayMediaStore.ts    # Railway production storage
    └── imageStore.ts           # IndexedDB local storage
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
```

## System Overview

### Technology Stack
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
- **Design**: Complete BlurBlur.ai clone (visual identity)
- **Layout**: Midjourney masonry system (never fixed grids)
- **Backend**: Civitai-inspired patterns (database schema, file processing only)

### Required Context Documents
Reference these files in the parent directory for detailed specifications:
- `DEVELOPMENT_STRATEGY_MASTER.md` - Core development strategy
- `PRODUCT_REQUIREMENTS_DOCUMENT.md` - Feature specifications
- `blurblur-design-analysis.md` - BlurBlur.ai design system
- `user-image-folder-analysis.md` - Real user data analysis

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