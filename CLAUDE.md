# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the planning and documentation repository for **TK AI 모델 갤러리** - an AI model gallery website that combines BlurBlur.ai's design identity with Midjourney's masonry layout system. The project is currently in the **documentation and planning phase** with no actual implementation code yet.

## Core Project Identity (Must Never Change)

- **Design Identity**: Complete clone of BlurBlur.ai (https://blurblur.ai/model/) - white theme, clean UI, professional branding
- **Layout System**: Midjourney-style masonry grid (https://www.midjourney.com/explore) - variable image sizes, responsive columns
- **Architecture Reference**: Civitai backend patterns (https://github.com/civitai/civitai) - database schema, API structure, file upload logic

## Development Strategy: Hybrid Approach

### Frontend: Custom Development
- **Stack**: Next.js 15.4.0-canary (App Router + React 19), TypeScript 5.9.2, Tailwind CSS v4, react-responsive-masonry, Framer Motion, Zustand + React Query
- **Responsibility**: 100% accurate BlurBlur.ai UI clone, perfect masonry implementation, admin-only interfaces

### Backend: Civitai-Inspired Architecture  
- **Stack**: Next.js 15.4.0 API Routes, PostgreSQL + Prisma ORM v6, NextAuth.js v5, AWS S3 + CloudFront, Sharp.js + FFmpeg
- **Responsibility**: Database schema patterns, file processing pipelines, authentication systems

## Key Architectural Decisions

### File Processing System
- **Supported Formats**: Images (JPEG, PNG, WebP) + Videos (MP4)
- **Batch Upload**: 600+ files supported based on real user data analysis
- **Auto Metadata Extraction**: Parse filenames for AI prompts, generation tools, series grouping
- **Processing Pipeline**: 
  - Images: WebP conversion, multi-resolution generation, color palette extraction
  - Videos: H.264 encoding, thumbnail extraction, multi-resolution conversion

### Admin-Only Upload System
- **Access Control**: Only admins can upload content (not a user-generated content platform)
- **Batch Management**: Folder drag-and-drop, pattern-based auto-classification, background processing
- **Smart Automation**: 90% metadata auto-extraction from filename patterns

### Data Model Key Fields
```typescript
// Core model supporting both images and videos
interface AIModel {
  file_type: 'IMAGE' | 'VIDEO';
  original_filename: string;
  ai_generation_tool: string;  // u3934589919, imgvnf, generation, etc.
  extracted_prompt: string;    // Auto-parsed from filename
  series_uuid: string;         // Group related variations
  variation_number: number;    // _0, _1, _2, _3 patterns
}
```

## Critical Requirements

### Performance Targets
- Page load: < 2.5s (3G network)
- Image display: < 1s (viewport)
- API response: < 500ms
- Core Web Vitals: All "Good"

### Real Data Constraints
- **File Distribution**: 83% PNG images, 16% MP4 videos, 1% JPEG
- **Storage Planning**: 1.47GB raw → 1.03GB optimized (40% WebP savings)
- **AWS S3 Cost**: ~$0.12/month estimated

## Essential Documentation Files

### Master Strategy Document
- **DEVELOPMENT_STRATEGY_MASTER.md**: Core development direction, must be referenced in every conversation
- Contains immutable principles, hybrid approach definition, technology decisions

### Implementation Specifications  
- **PRODUCT_REQUIREMENTS_DOCUMENT.md** (v2.0): Complete PRD with real data integration
- **project-architecture-overview.md**: Technical architecture and directory structure
- **user-image-folder-analysis.md**: Real user data analysis (601 files) that drives system requirements

### Design References
- **blurblur-design-analysis.md**: Complete analysis of BlurBlur.ai design system
- **midjourney-style-guide.md**: Technical implementation guide for masonry layout

## Development Phases

1. **Phase 1**: Environment setup, Civitai analysis, authentication system (2 weeks)
2. **Phase 2**: Large-scale upload system, filename parsing, video processing (4 weeks)  
3. **Phase 3**: Masonry gallery, search/filtering, contact system (3 weeks)
4. **Phase 4**: Testing, deployment, optimization (2 weeks)

## When Starting Implementation

1. Always read `DEVELOPMENT_STRATEGY_MASTER.md` first to understand core principles
2. Reference `PRODUCT_REQUIREMENTS_DOCUMENT.md` for detailed specifications  
3. Use `project-architecture-overview.md` for technical structure guidance
4. Follow the exact tech stack specified (no substitutions without updating master strategy)
5. Implement filename parsing system based on real patterns in `user-image-folder-analysis.md`

## Never Do
- Change the BlurBlur.ai design identity 
- Use fixed grid layouts (must be masonry)
- Copy Civitai's UI (only reference backend logic)
- Allow public user uploads (admin-only system)
- Ignore the performance targets or file processing requirements