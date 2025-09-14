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
};

export default nextConfig;
