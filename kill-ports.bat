@echo off
echo ======================================
echo 3000번대 포트 강제 종료 스크립트
echo ======================================

REM Method 1: netstat으로 포트별 프로세스 찾아서 종료
echo 🔍 방법 1: netstat으로 3000번대 포트 스캔 중...
for /l %%i in (3000,1,3020) do (
    echo 포트 %%i 확인 중...
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%%i ^| findstr LISTENING') do (
        if not "%%a"=="" (
            echo 📍 포트 %%i - PID %%a 종료 중...
            taskkill /f /pid %%a 2>nul && echo ✅ 종료됨 || echo ❌ 종료 실패
        )
    )
)

REM Method 2: 모든 Node.js 프로세스 종료
echo.
echo 🔍 방법 2: 모든 Node.js 프로세스 종료 중...
taskkill /f /im node.exe 2>nul && echo ✅ Node.js 프로세스 종료됨 || echo ℹ️  Node.js 프로세스가 없습니다

REM Method 3: npm 관련 프로세스 종료
echo.
echo 🔍 방법 3: npm 관련 프로세스 종료 중...
taskkill /f /im npm.cmd 2>nul && echo ✅ npm 프로세스 종료됨 || echo ℹ️  npm 프로세스가 없습니다

REM Method 4: Windows 네트워크 연결 확인
echo.
echo 📋 현재 3000번대 포트 사용 현황:
netstat -aon | findstr :300 | findstr LISTENING

echo.
echo ✅ 포트 종료 완료!
echo 3초 후 창이 닫힙니다...
timeout /t 3 >nul