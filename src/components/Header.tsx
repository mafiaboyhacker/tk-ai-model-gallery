'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지 (Contact 드롭다운)
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

  // 외부 클릭 감지 (모바일 메뉴)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // 모바일 메뉴 링크 클릭 시 메뉴 닫기
  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative">
          {/* 모바일 햄버거 버튼 - 좌측 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 z-50"
            aria-label="메뉴 열기"
          >
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`} />
            <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`} />
          </button>

          {/* 로고 중앙 배치 - IAXAI (Vogue 스타일 세리프) */}
          <Link
            href="/"
            className="logo-title text-6xl text-black/90 hover:text-black transition-colors absolute left-1/2 transform -translate-x-1/2"
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

      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      {/* 모바일 슬라이드 메뉴 */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 메뉴 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="메뉴 닫기"
          >
            <span className="text-lg text-black">×</span>
          </button>
        </div>

        {/* 메뉴 항목들 */}
        <nav className="py-6">
          <div className="space-y-1">
            <Link
              href="/model"
              onClick={handleMobileMenuClick}
              className="flex items-center px-6 py-4 text-lg font-medium text-black hover:bg-gray-100 transition-colors"
            >
              <span className="mr-3 text-xl">👥</span>
              MODEL
            </Link>

            <Link
              href="/video"
              onClick={handleMobileMenuClick}
              className="flex items-center px-6 py-4 text-lg font-medium text-black hover:bg-gray-100 transition-colors"
            >
              <span className="mr-3 text-xl">🎬</span>
              VIDEO
            </Link>

            <button
              onClick={() => {
                setIsContactOpen(true)
                setIsMobileMenuOpen(false)
              }}
              className="flex items-center w-full px-6 py-4 text-lg font-medium text-black hover:bg-gray-100 transition-colors text-left"
            >
              <span className="mr-3 text-xl">💬</span>
              CONTACT
            </button>
          </div>
        </nav>

        {/* 메뉴 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <Link
            href="/"
            onClick={handleMobileMenuClick}
            className="block text-center py-3 text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>

    </header>
  )
}