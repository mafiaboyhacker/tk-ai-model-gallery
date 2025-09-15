// 실시간 어드민페이지 vs 메인페이지 데이터 비교 스크립트
// 브라우저 개발자 도구 콘솔에서 실행하세요

async function comparePageData() {
  console.log('🔍 페이지별 데이터 상태 비교 시작...\n');

  // 1. 현재 페이지 확인
  const currentPath = window.location.pathname;
  console.log(`📍 현재 페이지: ${currentPath}`);

  // 2. useImageStore 상태 확인 (전역 상태)
  const storeState = window.__ZUSTAND_STORE__;
  if (storeState) {
    console.log('🏪 Zustand Store 상태:');
    console.log(`   - media 개수: ${storeState.media?.length || 0}`);
    if (storeState.media?.length > 0) {
      const images = storeState.media.filter(m => m.type === 'image').length;
      const videos = storeState.media.filter(m => m.type === 'video').length;
      console.log(`   - 이미지: ${images}개`);
      console.log(`   - 비디오: ${videos}개`);
      console.log('   - 샘플 데이터:', storeState.media.slice(0, 2));
    }
  } else {
    console.log('⚠️ Zustand Store를 찾을 수 없습니다.');
  }

  // 3. IndexedDB 직접 조회
  console.log('\n📦 IndexedDB 직접 조회:');
  try {
    const dbRequest = indexedDB.open('tk-gallery-media-db', 2);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allData = getAllRequest.result;
        console.log(`   - 총 데이터 개수: ${allData.length}`);

        if (allData.length > 0) {
          const images = allData.filter(item => item.type === 'image').length;
          const videos = allData.filter(item => item.type === 'video').length;
          console.log(`   - 이미지: ${images}개`);
          console.log(`   - 비디오: ${videos}개`);

          // 타입별 세부 분석
          console.log('\n🎬 비디오 데이터 세부 분석:');
          const videoData = allData.filter(item => item.type === 'video');
          videoData.forEach((video, index) => {
            console.log(`   비디오 ${index + 1}:`, {
              id: video.id,
              fileName: video.fileName,
              type: video.type,
              hasOriginalUrl: !!video.originalUrl,
              hasThumbnailUrl: !!video.thumbnailUrl,
              duration: video.duration,
              resolution: video.resolution,
              customName: video.customName
            });
          });

          console.log('\n🖼️ 이미지 데이터 샘플:');
          const imageData = allData.filter(item => item.type === 'image').slice(0, 2);
          imageData.forEach((image, index) => {
            console.log(`   이미지 ${index + 1}:`, {
              id: image.id,
              fileName: image.fileName,
              type: image.type,
              customName: image.customName
            });
          });
        }
      };

      getAllRequest.onerror = () => {
        console.error('❌ IndexedDB 데이터 조회 실패:', getAllRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('❌ IndexedDB 연결 실패:', dbRequest.error);
    };

  } catch (error) {
    console.error('❌ IndexedDB 조회 중 오류:', error);
  }

  // 4. DOM에서 실제 표시된 개수 확인
  console.log('\n🖥️ DOM에서 실제 표시된 데이터:');

  // 갤러리 컨테이너 찾기
  const galleryContainer = document.querySelector('[class*="masonry"]') ||
                          document.querySelector('[class*="gallery"]') ||
                          document.querySelector('[data-testid="gallery"]');

  if (galleryContainer) {
    const mediaCards = galleryContainer.querySelectorAll('[class*="card"], [class*="item"]');
    console.log(`   - 표시된 카드 개수: ${mediaCards.length}`);
  } else {
    console.log('   - 갤러리 컨테이너를 찾을 수 없습니다.');
  }

  // 5. 통계 UI 요소 확인 (어드민페이지인 경우)
  if (currentPath.includes('/admin')) {
    console.log('\n📊 어드민페이지 통계 UI:');

    // 통계 카드들 찾기
    const statCards = document.querySelectorAll('.text-2xl.font-bold.text-gray-900');
    if (statCards.length > 0) {
      statCards.forEach((card, index) => {
        const label = card.parentElement?.querySelector('.text-sm.text-gray-600')?.textContent;
        console.log(`   - ${label || `통계 ${index + 1}`}: ${card.textContent}`);
      });
    }

    // 파일 개수 표시 영역 찾기
    const countElements = document.querySelectorAll('*[class*="text-"]');
    const fileCountTexts = Array.from(countElements).filter(el =>
      el.textContent && el.textContent.includes('files')
    );

    if (fileCountTexts.length > 0) {
      console.log('   - 파일 개수 관련 텍스트:');
      fileCountTexts.forEach(el => {
        console.log(`     "${el.textContent}"`);
      });
    }
  }

  console.log('\n✅ 데이터 비교 완료');
}

// 실시간 상태 모니터링 (5초마다)
function startMonitoring() {
  console.log('🔄 실시간 모니터링 시작 (5초 간격)...\n');

  let count = 0;
  const interval = setInterval(() => {
    count++;
    console.log(`\n=== 모니터링 ${count}회차 ===`);
    comparePageData();

    if (count >= 3) {
      clearInterval(interval);
      console.log('\n⏹️ 모니터링 종료 (3회 완료)');
    }
  }, 5000);

  // 즉시 첫 번째 실행
  comparePageData();
}

// 실행 함수들
window.debugCompare = comparePageData;
window.debugMonitor = startMonitoring;

console.log('🛠️ 디버깅 함수 등록 완료:');
console.log('   - debugCompare(): 현재 상태 즉시 확인');
console.log('   - debugMonitor(): 실시간 모니터링 시작');
console.log('\n사용법: debugCompare() 또는 debugMonitor() 실행');

// 자동 시작
comparePageData();