@echo off
echo ======================================
echo TK AI Model Gallery - Server Restart
echo ======================================

REM Kill processes running on port 3000-3999
echo 🔄 3000번대 포트 사용 중인 프로세스 종료 중...

REM Find and kill processes using ports 3000-3020 (common development ports)
for /l %%i in (3000,1,3020) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%%i ^| findstr LISTENING') do (
        if not "%%a"=="" (
            echo 📍 포트 %%i - PID %%a 종료 중...
            taskkill /f /pid %%a 2>nul
        )
    )
)

REM Also kill all Node.js processes as backup
echo 🔄 모든 Node.js 프로세스 종료 중...
taskkill /f /im node.exe 2>nul || echo Node.js 프로세스가 없습니다.

timeout /t 3 >nul

REM Start development server
echo 🚀 개발 서버 시작 중...
echo 📍 URL: http://localhost:3000
echo 📍 Admin: http://localhost:3000/admin
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo ======================================

npm run dev

pause