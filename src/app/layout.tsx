import type { Metadata } from "next";
import { Libre_Bodoni, Jost } from "next/font/google";
import "./globals.css";

const libreBodoni = Libre_Bodoni({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-libre-bodoni',
});

const jost = Jost({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-jost',
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
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