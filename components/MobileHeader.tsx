'use client';

import React from 'react';
import Link from 'next/link';
import MobileNavigation from './MobileNavigation';

/**
 * 모바일 최적화 헤더 컴포넌트
 *
 * 특징:
 * - 로고와 햄버거 메뉴 겹침 방지
 * - 고정 높이로 일관된 레이아웃
 * - 안전한 영역 지원 (노치 대응)
 * - Z-index 최적화
 */

interface MobileHeaderProps {
  className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ className = '' }) => {
  return (
    <header className={`
      header-layer
      bg-white border-b border-gray-100
      safe-area-inset
      shadow-sm
      ${className}
    `}>
      {/* 모바일 헤더 (320px-767px) */}
      <div className="mobile-header lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          {/* 로고 영역 - 왼쪽 고정 */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-lg font-light text-gray-800 hover:text-gray-600 transition-colors"
            >
              blur blur
            </Link>
          </div>

          {/* 햄버거 메뉴 - 오른쪽 고정 */}
          <div className="flex-shrink-0">
            <MobileNavigation />
          </div>
        </div>
      </div>

      {/* 태블릿 헤더 (768px-1023px) */}
      <div className="tablet-header hidden lg:hidden md:block">
        <div className="flex items-center justify-between h-16 px-6">
          {/* 로고 */}
          <Link
            href="/"
            className="text-xl font-light text-gray-800 hover:text-gray-600 transition-colors"
          >
            blur blur
          </Link>

          {/* 태블릿 네비게이션 */}
          <nav className="flex items-center space-x-8">
            <Link
              href="/model"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              MODEL
            </Link>
            <Link
              href="/theme"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              THEME
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              CONTACT
            </Link>
          </nav>
        </div>
      </div>

      {/* 데스크톱 헤더 (1024px+) - 기존 디자인 유지 */}
      <div className="desktop-header hidden lg:block">
        <div className="flex items-center justify-between h-20 px-8 max-w-7xl mx-auto">
          {/* 로고 */}
          <Link
            href="/"
            className="text-2xl font-light text-gray-800 hover:text-gray-600 transition-colors"
          >
            blur blur
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="flex items-center space-x-12">
            <Link
              href="/model"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide"
            >
              MODEL
            </Link>
            <Link
              href="/theme"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide"
            >
              THEME
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide"
            >
              CONTACT
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;