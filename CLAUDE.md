# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TK AI 모델 갤러리** - An AI model gallery website combining BlurBlur.ai's design identity with Midjourney's masonry layout system. Currently in active development with a functional Next.js implementation featuring demo data and optimized components.

## Development Commands

```bash
# Development server with Turbopack
npm run dev              # Always runs on http://localhost:3000

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database operations
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open Prisma Studio for database management
```

## Core Architecture

### Technology Stack
- **Framework**: Next.js 15.5.2 (App Router + React 19)
- **Styling**: Tailwind CSS v4 with custom Google Fonts (Libre Bodoni + Jost)
- **Database**: PostgreSQL + Prisma ORM v6
- **Authentication**: NextAuth.js v4
- **State Management**: Zustand + React Query
- **File Storage**: AWS S3 integration with Sharp.js processing
- **UI Components**: react-responsive-masonry for Midjourney-style layout

### Key System Components

#### Filename Parsing System (`src/lib/file-parser.ts`)
Real user data-driven parsing system based on 601 file analysis:
```typescript
// Recognizes patterns like:
// u3934589919_prompt_uuid_0.png
// social_u3934589919_prompt_uuid_1.mp4
// generation-uuid.jpeg
// imgvnf_prompt_uuid_2.png
```

#### Database Schema (`prisma/schema.prisma`)
- **AIModel**: Core entity supporting both images and videos
- **User**: Admin authentication with role-based access
- **Inquiry**: 4-step customer inquiry system
- **UploadBatch**: Bulk file processing tracking

#### Component Architecture
- **MasonryGallery**: Responsive masonry grid with performance optimizations
- **ModelCard**: Individual model display with loading states
- **Header**: BlurBlur.ai-inspired navigation with IAXAI branding
- **Demo System**: Placeholder system using generated demo images

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
- AWS S3 cost optimization (~$0.12/month)

### Architecture References
- **Frontend**: Custom implementation following BlurBlur.ai exactly
- **Backend**: Civitai-inspired patterns (database schema, file processing)
- **Never copy**: Civitai's UI design (only reference backend logic)

## Development Context

The codebase is well-optimized with:
- TypeScript strict mode with custom type declarations
- Performance-optimized React components
- Clean dependency structure (17 core files)
- Comprehensive database schema ready for production
- Demo system for development and testing

Current state: Ready for backend API implementation and real data integration.