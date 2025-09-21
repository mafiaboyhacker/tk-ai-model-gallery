/**
 * 브라우저 캐시 및 IndexedDB 완전 삭제 API
 */

import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 클라이언트 측에서 실행할 캐시 정리 스크립트 반환
    const clearScript = `
      // IndexedDB 완전 삭제
      indexedDB.deleteDatabase('AIModelGallery');
      indexedDB.deleteDatabase('keyval-store');

      // LocalStorage 삭제
      localStorage.clear();
      sessionStorage.clear();

      // Service Worker 캐시 삭제 (있는 경우)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }

      // 브라우저 캐시 강제 무효화
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      console.log('🧹 브라우저 캐시 완전 삭제 완료');
      alert('캐시가 삭제되었습니다. 페이지를 새로고침합니다.');
      window.location.reload(true);
    `;

    return NextResponse.json({
      success: true,
      script: clearScript,
      message: '클라이언트 측 캐시 정리 스크립트 생성됨'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}