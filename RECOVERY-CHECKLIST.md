# Railway Recovery Checklist

## Prerequisites ✅
- [x] Railway CLI installed (4.9.0)
- [x] Authenticated as kim7804@gmail.com
- [x] Project files intact
- [x] railway.toml configured

## Manual Step Required
- [ ] **Execute: `railway link`**
  - Select "tk-ai-mode-web"
  - This must be done in interactive terminal

## Automated Recovery Commands
After manual linking, execute:

```bash
# Phase 1: Create PostgreSQL
railway add -d postgres
# ✅ Auto-creates DATABASE_URL

# Phase 2: Verify Volume
railway volume list
# ✅ uploads-volume should appear (from railway.toml)

# Phase 3: Check Environment
railway variables
# Should show:
# - DATABASE_URL (auto-injected)
# - NODE_ENV=production
# - RAILWAY_VOLUME_MOUNT_PATH=/data
# - RAILWAY_ENVIRONMENT=production

# Phase 4: Deploy
railway up
# ✅ Triggers build & deployment
```

## Post-Recovery Verification

### Health Checks
1. **Database**: `npx prisma db push` (runs automatically in start script)
2. **Health Endpoint**: `https://tk-ai-mode-web-production.up.railway.app/api/health`
3. **Volume Mount**: Files should persist at `/data/uploads`

### Expected Environment Variables
```
DATABASE_URL=postgresql://user:password@host:port/database (auto-injected)
NEXTAUTH_SECRET=<generate-random>
NEXTAUTH_URL=https://tk-ai-mode-web-production.up.railway.app
NODE_ENV=production
RAILWAY_VOLUME_MOUNT_PATH=/data
RAILWAY_ENVIRONMENT=production
NEXT_TELEMETRY_DISABLED=1
```

### File Structure Verification
```
/data/
  └── uploads/
      ├── images/
      └── videos/
```

## Recovery Timeline
- **Manual Link**: 1 minute
- **PostgreSQL Creation**: 2-3 minutes
- **Volume Setup**: Instant (pre-configured)
- **Deployment**: 3-5 minutes
- **Total**: ~10 minutes

## Troubleshooting

### If DATABASE_URL Missing
```bash
railway variables set DATABASE_URL ${{Postgres.DATABASE_URL}}
```

### If Volume Not Mounted
```bash
railway volume create uploads-volume --size 5
# Then redeploy
railway up
```

### If Deployment Fails
```bash
railway logs
# Check for specific errors
```

## Success Indicators
- [ ] PostgreSQL service visible in Railway dashboard
- [ ] DATABASE_URL environment variable present
- [ ] uploads-volume mounted at /data
- [ ] Health endpoint returns 200 OK
- [ ] File uploads working
- [ ] Admin dashboard accessible

## Files Updated
- [x] railway.toml (pre-configured)
- [x] package.json start script includes `prisma db push`
- [x] Next.js config has volume rewrites
- [x] Prisma schema ready for PostgreSQL