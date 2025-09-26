# Railway Recovery PowerShell Script
# Prerequisites: railway link completed manually

Write-Host "=== Railway Recovery Script ===" -ForegroundColor Green
Write-Host "Prerequisites: railway link completed manually" -ForegroundColor Yellow
Write-Host ""

# Check if linked
Write-Host "Checking project link status..." -ForegroundColor Blue
railway status

# Phase 2: Create PostgreSQL Database
Write-Host "Phase 2: Creating PostgreSQL database..." -ForegroundColor Blue
railway add -d postgres
Write-Host "✅ PostgreSQL service created" -ForegroundColor Green
Write-Host ""

# Check volume
Write-Host "Phase 3: Checking volume setup..." -ForegroundColor Blue
railway volume list
Write-Host ""

# Environment variables
Write-Host "Phase 4: Environment variables status..." -ForegroundColor Blue
railway variables
Write-Host ""

# Deploy
Write-Host "Phase 5: Triggering deployment..." -ForegroundColor Blue
railway up
Write-Host ""

Write-Host "=== Recovery Complete! ===" -ForegroundColor Green
Write-Host "Next: Test at https://tk-ai-mode-web-production.up.railway.app/api/health" -ForegroundColor Yellow