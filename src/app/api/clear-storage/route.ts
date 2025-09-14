/**
 * LocalStorage 정리 API
 * 브라우저의 localStorage를 초기화하는 HTML 페이지를 반환
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>🧹 Storage 정리 완료</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .status {
            font-size: 48px;
            margin: 20px 0;
        }
        h1 {
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .info {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .success {
            background: rgba(34, 197, 94, 0.3);
            border: 2px solid rgba(34, 197, 94, 0.6);
        }
        .btn {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .btn-admin {
            background: #3b82f6;
        }
        .btn-admin:hover {
            background: #2563eb;
        }
        .cleanup-result {
            margin: 20px 0;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status" id="status">⏳</div>
        <h1>Storage 정리 중...</h1>

        <div class="info" id="result">
            <p>🔄 LocalStorage 정리를 수행하고 있습니다...</p>
        </div>

        <div class="info success" id="instructions" style="display:none;">
            <h3>✅ 정리 완료!</h3>
            <div class="cleanup-result" id="cleanup-details"></div>
            <p><strong>다음 단계:</strong></p>
            <ol>
                <li>아래 링크들을 클릭하여 테스트하세요</li>
                <li>메인 페이지에서 기존 이미지들이 사라졌는지 확인</li>
                <li>어드민 페이지에서 새 파일을 업로드해보세요</li>
            </ol>
        </div>

        <div id="links" style="display:none;">
            <a href="https://ai-model-gallery.vercel.app/" class="btn" target="_blank">
                🏠 메인 페이지 확인
            </a>
            <a href="https://ai-model-gallery.vercel.app/admin/images" class="btn btn-admin" target="_blank">
                📱 어드민 페이지 테스트
            </a>
        </div>
    </div>

    <script>
        async function clearStorage() {
            const statusEl = document.getElementById('status');
            const resultEl = document.getElementById('result');
            const instructionsEl = document.getElementById('instructions');
            const linksEl = document.getElementById('links');
            const detailsEl = document.getElementById('cleanup-details');

            try {
                // 1. 현재 localStorage 상태 확인
                statusEl.textContent = '🔍';
                resultEl.innerHTML = '<p>🔍 현재 저장된 데이터 확인 중...</p>';

                const beforeCount = localStorage.length;
                const uploadedMedia = localStorage.getItem('uploadedMedia');
                let mediaCount = 0;

                if (uploadedMedia) {
                    try {
                        const media = JSON.parse(uploadedMedia);
                        mediaCount = media.length;
                    } catch (e) {
                        mediaCount = 1; // 파싱 불가하지만 데이터는 있음
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // 2. localStorage 정리
                statusEl.textContent = '🗑️';
                resultEl.innerHTML = '<p>🗑️ LocalStorage 정리 중...</p>';

                localStorage.clear();
                localStorage.setItem('uploadedMedia', '[]');

                await new Promise(resolve => setTimeout(resolve, 1000));

                // 3. 완료
                statusEl.textContent = '✅';
                resultEl.style.display = 'none';
                instructionsEl.style.display = 'block';
                linksEl.style.display = 'block';

                // 정리 결과 표시
                detailsEl.innerHTML = \`
                    <strong>정리된 데이터:</strong><br>
                    • LocalStorage 항목: \${beforeCount}개<br>
                    • 업로드된 미디어: \${mediaCount}개<br>
                    • 상태: 완전 초기화됨
                \`;

                document.title = '✅ Storage 정리 완료';

            } catch (error) {
                statusEl.textContent = '❌';
                resultEl.innerHTML = \`
                    <p>❌ 정리 중 오류가 발생했습니다:</p>
                    <p style="color: #fca5a5;">\${error.message}</p>
                \`;
            }
        }

        // 페이지 로드 시 자동 실행
        window.addEventListener('load', clearStorage);
    </script>
</body>
</html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}