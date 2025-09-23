'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isContactOpen, setIsContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setIsContactOpen(false)
      }
    }

    if (isContactOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isContactOpen])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-xl z-50">
      {/* 모바일 전용 카테고리 - 햄버거 버튼 위 */}
      <div className="block md:hidden bg-white/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center space-x-8 py-2">
            <Link
              href="/"
              className="nav-text text-xs text-black/80 hover:text-black transition-colors font-bold"
            >
              ALL
            </Link>
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-20 relative">
          {/* 로고 중앙 배치 - IAXAI (Vogue 스타일 세리프) */}
          <Link
            href="/"
            className="logo-title text-6xl text-black/90 hover:text-black transition-colors"
          >
            IAXAI
          </Link>

          {/* 메인 네비게이션 - 우측 절대 위치 (PC에서만 표시) */}
          <nav className="hidden md:flex items-center space-x-12 absolute right-0">
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
            <div className="relative" ref={contactRef}>
              <button
                onClick={() => setIsContactOpen(!isContactOpen)}
                className="nav-text text-xs text-black/80 hover:text-black transition-colors font-bold"
              >
                CONTACT
              </button>

              {/* 말풍선 스타일 드롭다운 */}
              {isContactOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {/* 말풍선 화살표 */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white/5 backdrop-blur-2xl border-l border-t border-white/10 rotate-45"></div>

                  {/* 내용 */}
                  <div className="p-6 relative">
                    {/* 닫기 버튼 */}
                    <button
                      onClick={() => setIsContactOpen(false)}
                      className="absolute top-3 right-3 text-black hover:text-gray-700 transition-colors text-xl w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm"
                    >
                      ×
                    </button>

                    {/* Coming Soon 내용 */}
                    <div className="text-center font-sans">
                      <h3 className="text-lg font-bold text-black mb-3">
                        COMING SOON
                      </h3>
                      <div className="text-sm text-black">
                        <p className="mb-2">문의는</p>
                        <p className="font-semibold text-black">김태은</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

    </header>
  )
}