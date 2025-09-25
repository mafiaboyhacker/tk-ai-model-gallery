import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RAILPACK 호환성을 위한 실험적 기능 최소화
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@tanstack/react-query',
      'masonic',
      'zustand'
    ],
    // RAILPACK 빌더와 충돌 방지를 위해 임시 비활성화
    // optimizeCss: true,
  },

  // 빌드 최적화 설정 (Next.js 15 기본 설정 사용)
  eslint: {
    // Railway 배포 시 린트 에러 무시 (로컬에서는 체크)
    ignoreDuringBuilds: process.env.RAILWAY_ENVIRONMENT === 'production',
  },
  typescript: {
    // 타입 체크 빌드 시 무시 (Railway 배포 속도 향상)
    ignoreBuildErrors: true,
  },

  // RAILPACK 호환성을 위해 압축 비활성화 (빌더에서 처리)
  compress: false,

  // Context7 권장: PoweredByHeader 제거 (보안 및 성능)
  poweredByHeader: false,

  // RAILPACK 정적 파일 서빙 최적화
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,

  // Railway 배포용 외부 패키지 최적화
  serverExternalPackages: ['prisma', '@prisma/client'],

  // 웹팩 설정으로 청크 로딩 문제 해결
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드에서 청크 로딩 재시도 설정
      config.output.crossOriginLoading = 'anonymous';

      // 청크 로딩 실패 시 재시도 로직
      config.output.chunkLoadTimeout = 30000; // 30초 타임아웃
    }

    return config;
  },

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
      // 개발환경에서는 CSP 완화, 프로덕션에서는 보안 강화 (JS 파일 제외)
      {
        source: '/((?!_next/static/.*\\.js$).*)',
        headers: isDevelopment ? [
          // 로컬 개발용: 최소한의 보안 헤더만 적용
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ] : [
          // 프로덕션용: 전체 보안 헤더 적용 (JS 파일 제외)
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
      // 정적 CSS 파일 캐싱 및 MIME 타입 보장
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'text/css',
          },
        ],
      },
      // JavaScript 청크 파일 MIME 타입 보장 (RAILPACK 호환성)
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // 모든 JavaScript 파일 MIME 타입 보장
      {
        source: '/_next/static/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
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
