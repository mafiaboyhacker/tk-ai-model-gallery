@echo off
echo =================================
echo Railway CLI 자동 재연결 스크립트
echo =================================
echo.

echo 1. 현재 상태 확인
railway status
echo.

echo 2. 프로젝트 링크 (steadfast-dream)
echo steadfast-dream | railway link
echo.

echo 3. 서비스 선택 (tk-ai-model-gallery)
echo tk-ai-model-gallery | railway service
echo.

echo 4. 연결 상태 재확인
railway status
echo.

echo 5. 배포 시도
railway deploy --detach
echo.

echo =================================
echo 재연결 완료!
echo Railway 대시보드에서 배포 상태를 확인하세요.
echo =================================
pause