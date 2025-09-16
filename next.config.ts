import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 배포시 린트 오류 무시 (경고만 허용)
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
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
