@echo off
chcp 65001 >nul
echo ======================================
echo TK AI Model Gallery - Quick Deploy
echo ======================================

REM Quick deployment without prompts
echo 🚀 Starting quick deployment...

REM Auto-commit if there are changes
for /f %%i in ('git status --porcelain 2^>nul ^| wc -l') do set changes=%%i
if %changes% gtr 0 (
    echo 📝 Auto-committing changes...
    git add .
    git commit -m "feat: 자동 배포 - $(date +%%Y-%%m-%%d %%H:%%M:%%S)"
    echo ✅ Changes committed
)

echo 📤 Pushing to GitHub...
git push origin main

echo 🚀 Deploying to Railway...
railway deploy

echo.
echo ✅ Quick deployment completed!
echo 📍 URL: https://ai-model-gallery.railway.app
echo ======================================

timeout /t 3 >nul