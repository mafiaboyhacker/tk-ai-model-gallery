# MANUAL RAILWAY LINK REQUIRED ⚠️

## The automated CLI cannot complete interactive Railway linking.

### Please execute in your terminal:

```bash
cd C:\Users\TK\Documents\llmcode\tkbm\tk_infl2\tk-ai-model-gallery
railway link
```

**When prompted:**
1. Select workspace: "mafiaboyhacker's Projects"
2. Select project: "tk-ai-mode-web"

### After successful linking, run:

```bash
# Create PostgreSQL database
railway add -d postgres

# Check status
railway status

# Check variables (should show DATABASE_URL)
railway variables

# Deploy
railway up
```

### Or execute the recovery script:

**Windows:**
```powershell
.\railway-recovery.ps1
```

**Linux/Mac:**
```bash
chmod +x railway-recovery.sh
./railway-recovery.sh
```

## Why Manual Link is Required

The Railway CLI requires interactive selection in non-headless environments. The project must be manually linked before database creation can proceed.

## Next Steps After Linking

Once `railway link` is completed:
1. PostgreSQL service will be created
2. DATABASE_URL will be auto-injected
3. uploads-volume will be available (pre-configured)
4. Application will be deployed
5. Recovery will be complete

**Please run `railway link` now and confirm when complete.**