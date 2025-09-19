/**
 * IndexedDB 강제 정리 API
 */

import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const clearScript = `
      (async function() {
        console.log('🧹 IndexedDB 강제 정리 시작...');

        // 모든 가능한 IndexedDB 데이터베이스 삭제
        const databases = [
          'AIModelGallery',
          'keyval-store',
          'MediaDB',
          'imageStore',
          'videoStore',
          'mediaStore'
        ];

        for (const dbName of databases) {
          try {
            await new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => {
                console.log('✅ 삭제 완료:', dbName);
                resolve();
              };
              deleteReq.onerror = () => {
                console.log('⚠️ 삭제 시도:', dbName, '(이미 없음)');
                resolve();
              };
              deleteReq.onblocked = () => {
                console.log('🔒 삭제 차단됨:', dbName);
                resolve();
              };
            });
          } catch (e) {
            console.log('⚠️ 삭제 오류:', dbName, e);
          }
        }

        // LocalStorage 완전 정리
        localStorage.clear();
        sessionStorage.clear();

        // Service Worker 캐시 정리
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }

        // 브라우저 캐시 정리
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
          }
        }

        console.log('✅ 모든 브라우저 저장소 정리 완료');
        alert('브라우저 저장소가 완전히 정리되었습니다. 페이지를 새로고침합니다.');
        window.location.reload(true);
      })();
    `;

    return NextResponse.json({
      success: true,
      script: clearScript,
      message: 'IndexedDB 강제 정리 스크립트 생성됨'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}