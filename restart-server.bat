@echo off
echo ======================================
echo TK AI Model Gallery - Server Restart
echo ======================================

REM Kill processes running on port 3000-3020
echo Cleaning up ports 3000-3020...

REM Find and kill processes using ports 3000-3020
for /l %%i in (3000,1,3020) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%%i ^| findstr LISTENING') do (
        if not "%%a"=="" (
            echo Killing PID %%a on port %%i...
            taskkill /f /pid %%a >nul 2>&1
        )
    )
)

REM Also kill all Node.js processes as backup
echo Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

REM Wait for processes to fully terminate
echo Waiting for cleanup...
timeout /t 3 >nul

REM Check if port 3000 is still in use
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        echo Port 3000 still in use by PID %%a, force killing...
        taskkill /f /pid %%a >nul 2>&1
        timeout /t 2 >nul
    )
)

REM Start development server
echo Starting development server...
echo URL: http://localhost:3000
echo Admin: http://localhost:3000/admin
echo.
echo Press Ctrl+C to stop the server.
echo ======================================

npm run dev

pause