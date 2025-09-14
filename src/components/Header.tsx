'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-20 relative">
          {/* 로고 중앙 배치 - IAXAI (Vogue 스타일 세리프) */}
          <Link
            href="/"
            className="logo-title text-6xl text-black/90 hover:text-black transition-colors"
          >
            IAXAI
          </Link>

          {/* 메인 네비게이션 - 우측 절대 위치 */}
          <nav className="flex items-center space-x-12 absolute right-0">
            <Link
              href="/model"
              className="nav-text text-xs text-black/80 hover:text-black transition-colors font-bold"
            >
              MODEL
            </Link>
            <Link
              href="/video"
              className="nav-text text-xs text-black/80 hover:text-black transition-colors font-bold"
            >
              VIDEO
            </Link>
            <Link
              href="/contact"
              className="nav-text text-xs text-black/80 hover:text-black transition-colors font-bold"
            >
              CONTACT
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}