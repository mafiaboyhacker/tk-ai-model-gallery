// IndexedDB 데이터 확인용 디버깅 스크립트
// 브라우저 개발자 도구 콘솔에서 실행하세요

async function debugIndexedDB() {
  console.log('=== IndexedDB 데이터 분석 시작 ===');

  try {
    // IndexedDB 열기
    const dbRequest = indexedDB.open('tk-gallery-media-db', 2);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allData = getAllRequest.result;

        console.log(`📊 총 파일 개수: ${allData.length}`);

        // 타입별 분석
        const images = allData.filter(item => item.type === 'image');
        const videos = allData.filter(item => item.type === 'video');

        console.log(`🖼️ 이미지: ${images.length}개`);
        console.log(`🎬 비디오: ${videos.length}개`);

        // 데이터 구조 분석
        if (allData.length > 0) {
          console.log('📋 첫 번째 데이터 구조:', allData[0]);

          // URL 타입 분석
          console.log('\n🔍 URL 패턴 분석:');
          allData.slice(0, 3).forEach((item, index) => {
            console.log(`${index + 1}. ${item.type}:`);
            console.log(`   thumbnailUrl: ${item.thumbnailUrl?.substring(0, 50)}...`);
            console.log(`   originalUrl: ${item.originalUrl?.substring(0, 50)}...`);
          });

          // 비디오 데이터 특별 분석
          if (videos.length > 0) {
            console.log('\n🎬 비디오 데이터 상세 분석:');
            videos.slice(0, 2).forEach((video, index) => {
              console.log(`비디오 ${index + 1}:`, {
                id: video.id,
                fileName: video.fileName,
                type: video.type,
                hasOriginalUrl: !!video.originalUrl,
                hasThumbnailUrl: !!video.thumbnailUrl,
                thumbnailStartsWith: video.thumbnailUrl?.startsWith('data:'),
                originalStartsWith: video.originalUrl?.startsWith('data:'),
                duration: video.duration,
                resolution: video.resolution
              });
            });
          }
        }

        console.log('=== IndexedDB 데이터 분석 완료 ===');
      };

      getAllRequest.onerror = () => {
        console.error('❌ 데이터 조회 실패:', getAllRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('❌ IndexedDB 연결 실패:', dbRequest.error);
    };

  } catch (error) {
    console.error('❌ 디버깅 스크립트 실행 실패:', error);
  }
}

// 실행
debugIndexedDB();