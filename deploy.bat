@echo off
chcp 65001 >nul
echo ======================================
echo TK AI Model Gallery - Quick Deploy
echo ======================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the ai-model-gallery directory.
    pause
    exit /b 1
)

echo 🔍 Checking git status...
git status --porcelain > nul
if %errorlevel% neq 0 (
    echo ❌ Error: Not a git repository
    pause
    exit /b 1
)

echo 📋 Current git status:
git status

echo.
echo 🚀 Starting deployment process...
echo.

REM Check if there are uncommitted changes
for /f %%i in ('git status --porcelain 2^>nul ^| wc -l') do set changes=%%i
if %changes% gtr 0 (
    echo ⚠️ You have uncommitted changes.
    set /p commit_choice="Do you want to commit them first? (y/n): "
    if /i "!commit_choice!"=="y" (
        set /p commit_message="Enter commit message: "
        echo 📝 Adding and committing changes...
        git add .
        git commit -m "!commit_message!"
        if %errorlevel% neq 0 (
            echo ❌ Error: Commit failed
            pause
            exit /b 1
        )
        echo ✅ Changes committed successfully
    )
)

echo 📤 Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Error: Git push failed
    pause
    exit /b 1
)
echo ✅ Pushed to GitHub successfully

echo 🚀 Deploying to Railway...
railway deploy
if %errorlevel% neq 0 (
    echo ❌ Error: Railway deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo 📍 Main URL: https://ai-model-gallery.railway.app
echo 📍 Admin: https://ai-model-gallery.railway.app/admin
echo.
echo 🎉 Your latest changes are now live!
echo ======================================

pause