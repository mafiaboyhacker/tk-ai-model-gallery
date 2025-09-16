import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Context7 권장: 패키지 임포트 최적화
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'react-responsive-masonry'
    ],
    // Context7 권장: CSS 청킹 최적화
    cssChunking: true,
  },
  eslint: {
    // 배포시 린트 오류 무시 (경고만 허용)
    ignoreDuringBuilds: true,
  },

  // Context7 권장: 압축 활성화
  compress: true,

  // Context7 권장: PoweredByHeader 제거 (보안 및 성능)
  poweredByHeader: false,

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
      // Supabase 이미지 도메인 추가
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Force cache invalidation for specific pages
  async headers() {
    return [
      {
        source: '/supabase-test',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Cache-Bust',
            value: Date.now().toString(),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
