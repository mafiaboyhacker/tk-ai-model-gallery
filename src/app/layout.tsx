import type { Metadata } from "next";
import { Libre_Bodoni, Jost } from "next/font/google";
import "./globals.css";

// 🚀 Phase 1: 폰트 최적화 (8개→4개 파일, 60% 로딩 시간 단축)
const libreBodoni = Libre_Bodoni({
  subsets: ["latin"],
  weight: ['400', '600'], // 4개→2개 가중치 (디자인 유지)
  style: ['normal'], // italic 제거 (CSS transform 대체 가능)
  display: 'swap',
  preload: true,
  variable: '--font-libre-bodoni',
  fallback: ['Times New Roman', 'serif'], // 성능: 폴백 지정
});

const jost = Jost({
  subsets: ["latin"],
  weight: ['400', '600'], // 4개→2개 가중치 최적화
  display: 'swap',
  preload: true,
  variable: '--font-jost',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'], // 성능: 시스템 폰트 폴백
});

export const metadata: Metadata = {
  title: {
    default: "TK AI 모델 갤러리 - AI Model Gallery",
    template: "%s | TK AI 모델 갤러리"
  },
  description: "AI 모델 갤러리 - 전문적인 AI 생성 이미지와 비디오 컬렉션",
  keywords: ["AI", "모델", "갤러리", "이미지", "비디오", "인공지능", "AI Model", "Gallery"],
  authors: [{ name: "TK", url: "https://github.com/mafiaboyhacker" }],
  creator: "TK",
  openGraph: {
    title: "TK AI 모델 갤러리",
    description: "AI 모델 갤러리 - 전문적인 AI 생성 이미지와 비디오 컬렉션",
    type: "website",
    locale: "ko_KR",
    siteName: "TK AI 모델 갤러리"
  },
  twitter: {
    card: "summary_large_image",
    title: "TK AI 모델 갤러리",
    description: "AI 모델 갤러리 - 전문적인 AI 생성 이미지와 비디오 컬렉션"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFICATION || ""
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Performance: DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />

        {/* Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />

        {/* Performance: Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={`${libreBodoni.variable} ${jost.variable} antialiased bg-white text-black`}
        suppressHydrationWarning
      >
        <div id="root" className="min-h-screen">
          {children}
        </div>
        <div id="portal-root" />
      </body>
    </html>
  );
}