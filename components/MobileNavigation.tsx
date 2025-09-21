'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 모바일 네비게이션 컴포넌트
 *
 * 특징:
 * - BlurBlur.ai 디자인 시스템 100% 유지
 * - 햄버거 메뉴 방식 (모바일 전용)
 * - 터치 친화적 인터랙션
 * - 접근성 최적화
 */

interface MobileNavigationProps {
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 메뉴 토글
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 메뉴 닫기
  const closeMenu = () => {
    setIsOpen(false);
  };

  // 경로 변경 시 메뉴 닫기
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // 스크롤 잠금 (메뉴 열릴 때)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    { href: '/', label: 'HOME' },
    { href: '/model', label: 'MODEL' },
    { href: '/theme', label: 'THEME' },
    { href: '/contact', label: 'CONTACT' }
  ];

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <button
        type="button"
        className={`
          hamburger-btn header-menu touch-target hamburger-layer
          flex flex-col justify-center items-center
          w-10 h-10 p-1
          ${className}
        `}
        onClick={toggleMenu}
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <span className={`hamburger-line ${isOpen ? 'hamburger-open' : ''}`} />
        <span className={`hamburger-line ${isOpen ? 'hamburger-open' : ''}`} />
        <span className={`hamburger-line ${isOpen ? 'hamburger-open' : ''}`} />
      </button>

      {/* 모바일 메뉴 오버레이 */}
      <div
        id="mobile-menu"
        className={`mobile-menu mobile-menu-layer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="네비게이션 메뉴"
      >
        <div className="mobile-menu-content">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="text-2xl font-light text-gray-800"
              onClick={closeMenu}
            >
              blur blur
            </Link>
            <button
              type="button"
              className="hamburger-btn touch-target"
              onClick={closeMenu}
              aria-label="메뉴 닫기"
            >
              <div className="hamburger-line hamburger-open" />
              <div className="hamburger-line hamburger-open" />
              <div className="hamburger-line hamburger-open" />
            </button>
          </div>

          {/* 메뉴 아이템 */}
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-menu-item touch-feedback ${
                  pathname === item.href
                    ? 'text-gray-800 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 푸터 */}
          <div className="mt-auto pt-8 pb-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              ©Blur Blur. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={closeMenu}
              >
                Privacy
              </Link>
              <a
                href="mailto:contact@blurblur.ai"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                contact@blurblur.ai
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 백드롭 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-layer"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default MobileNavigation;