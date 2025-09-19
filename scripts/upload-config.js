/**
 * 배치 업로드 설정 파일
 * 실제 폴더 경로를 여기서 설정하세요
 */

module.exports = {
  // 폴더 경로 설정 (실제 401개 파일 폴더)
  folders: {
    images: 'C:\\Users\\TK\\Documents\\llmcode\\tkbm\\tk_infl\\image',     // 312개 이미지 파일
    videos: 'C:\\Users\\TK\\Documents\\llmcode\\tkbm\\tk_infl\\video'      // 89개 비디오 파일
  },

  // Railway API 설정
  api: {
    baseUrl: 'https://tk-ai-model-gallery-production.up.railway.app',
    uploadEndpoint: '/api/railway/storage?action=upload',
    timeout: 60000 // 60초
  },

  // 업로드 설정 (안정성 개선)
  upload: {
    imageConcurrency: 2,  // 이미지 동시 업로드 수 (Railway 안정성 위해 감소)
    videoConcurrency: 1,  // 동영상 동시 업로드 수 (더 무거우므로 1개씩)
    cooldownMs: 3000,     // 청크 간 대기시간 (ms) - Railway 서버 부하 고려
    retries: 3            // 실패시 재시도 횟수
  },

  // 지원 파일 형식
  supportedFormats: {
    images: ['.png', '.jpg', '.jpeg', '.webp'],
    videos: ['.mp4']
  }
}