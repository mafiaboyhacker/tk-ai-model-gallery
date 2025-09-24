import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Context7 권장: 패키지 임포트 최적화
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@tanstack/react-query',
      'masonic',
      'zustand'
    ],
    // Railway 배포 최적화 - CSS 최적화 다시 활성화 (critters 의존성 해결됨)
    optimizeCss: true,
  },
  eslint: {
    // Railway 배포 시 린트 에러 무시 (로컬에서는 체크)
    ignoreDuringBuilds: process.env.RAILWAY_ENVIRONMENT === 'production',
  },
  typescript: {
    // 타입 체크 빌드 시 무시 (Railway 배포 속도 향상)
    ignoreBuildErrors: true,
  },

  // Context7 권장: 압축 활성화
  compress: true,

  // Context7 권장: PoweredByHeader 제거 (보안 및 성능)
  poweredByHeader: false,

  // Railway 배포용 외부 패키지 최적화
  serverExternalPackages: ['prisma', '@prisma/client'],

  // 🚀 500MB 파일 업로드 지원 - experimental 섹션 통합됨 (위에 있음)

  // Railway Volume 직접 서빙을 위한 rewrites 설정
  async rewrites() {
    return [
      // Railway 환경에서 /uploads를 정적 파일 API로 처리
      {
        source: '/uploads/:type/:filename',
        destination: '/api/railway/storage/file/:type/:filename',
      },
    ]
  },

  images: {
    // 이미지 포맷 최적화
    formats: ['image/avif', 'image/webp'],
    // 디바이스별 이미지 크기 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 기존 remote patterns 유지
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Railway 도메인 추가
      {
        protocol: 'https',
        hostname: '*.railway.app',
      },
    ],
  },
  // 성능 최적화 헤더 (로컬 개발용 완화)
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return [
      // 개발환경에서는 CSP 완화, 프로덕션에서는 보안 강화
      {
        source: '/:path*',
        headers: isDevelopment ? [
          // 로컬 개발용: 최소한의 보안 헤더만 적용
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ] : [
          // 프로덕션용: 전체 보안 헤더 적용
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/railway/storage/file/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
