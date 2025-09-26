#!/bin/bash
# Railway Recovery Commands - Execute after manual project linking

echo "=== Railway Recovery Script ==="
echo "Prerequisites: railway link completed manually"
echo ""

# Phase 2: Create PostgreSQL Database
echo "Phase 2: Creating PostgreSQL database..."
railway add -d postgres
echo "✅ PostgreSQL service created"
echo ""

# Phase 3: Volume Setup (if not exists)
echo "Phase 3: Checking volume setup..."
railway volume list
echo ""

# Phase 4: Environment Variables Check
echo "Phase 4: Environment variables status..."
railway variables
echo ""

# Phase 5: Deploy
echo "Phase 5: Triggering deployment..."
railway up
echo ""

echo "=== Next Steps ==="
echo "1. Verify DATABASE_URL is auto-injected"
echo "2. Check volume mount at /data"
echo "3. Test health endpoint: /api/health"
echo "4. Test upload functionality"

# Health check
echo ""
echo "Waiting for deployment..."
sleep 30
echo "Checking health endpoint..."
curl -f https://tk-ai-mode-web-production.up.railway.app/api/health || echo "Health check failed - service may still be starting"