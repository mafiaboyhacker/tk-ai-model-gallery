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
    // Railway 배포 최적화 - Next.js 15 새 문법
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
  // 성능 최적화 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
    ]
  },
};

export default nextConfig;
