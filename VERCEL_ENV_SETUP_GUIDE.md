# 🚀 Vercel Environment Variables Setup Guide

## 📋 Quick Setup Instructions

### 1. Access Vercel Dashboard
1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create new deployment)
3. Go to **Settings** → **Environment Variables**

### 2. Required Environment Variables

**Copy and paste each variable individually into Vercel:**

#### Core Application Settings
```
NODE_ENV
production
```

```
NEXT_PUBLIC_APP_URL
https://your-domain.vercel.app
```

```
NEXTAUTH_URL
https://your-domain.vercel.app
```

#### Supabase Configuration (Use NEW credentials after rotation)
```
NEXT_PUBLIC_SUPABASE_URL
https://YOUR_PROJECT_ID.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ANON_KEY_HERE
```

```
SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY_HERE
```

#### Authentication
```
NEXTAUTH_SECRET
YOUR_GENERATED_32_CHARACTER_SECRET
```

#### Admin Configuration
```
ADMIN_EMAIL
your-admin-email@domain.com
```

```
ADMIN_PASSWORD
YOUR_STRONG_GENERATED_PASSWORD
```

#### File Processing Settings
```
MAX_FILE_SIZE_MB
100
```

```
MAX_BATCH_SIZE
1000
```

```
SUPPORTED_IMAGE_TYPES
jpeg,jpg,png,webp
```

```
SUPPORTED_VIDEO_TYPES
mp4,mov,avi
```

```
IMAGE_QUALITY_WEBP
85
```

```
IMAGE_QUALITY_JPEG
90
```

```
VIDEO_THUMBNAIL_TIME
1
```

```
CDN_CACHE_TTL
31536000
```

## 🔧 Environment-Specific Configuration

### Production Environment Variables
Set these for **Production** environment only:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Enables production optimizations |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Your actual production domain |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Must match production domain |

### Preview Environment Variables
Set these for **Preview** environment:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `development` | Enables development features |
| `NEXT_PUBLIC_APP_URL` | `$VERCEL_URL` | Uses Vercel's preview URL |
| `NEXTAUTH_URL` | `https://$VERCEL_URL` | Dynamic preview URL |

### Development Environment Variables
These are automatically inherited or not needed for Vercel deployments.

## 🎯 Vercel CLI Method (Alternative)

If you prefer using the CLI:

### 1. Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

### 2. Link Project
```bash
cd ai-model-gallery
vercel link
```

### 3. Set Environment Variables
```bash
# Production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... (repeat for all variables)

# Preview variables
vercel env add NEXT_PUBLIC_APP_URL preview
# ... (repeat for preview-specific variables)
```

### 4. Pull Environment Variables (for local development)
```bash
vercel env pull .env.local
```

## ⚡ Bulk Import Script

Create a file `vercel-env.json` with your variables and import:

```json
{
  "NODE_ENV": "production",
  "NEXT_PUBLIC_APP_URL": "https://your-domain.vercel.app",
  "NEXTAUTH_URL": "https://your-domain.vercel.app",
  "NEXT_PUBLIC_SUPABASE_URL": "https://YOUR_PROJECT_ID.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "YOUR_NEW_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY": "YOUR_NEW_SERVICE_ROLE_KEY",
  "NEXTAUTH_SECRET": "YOUR_32_CHAR_SECRET",
  "ADMIN_EMAIL": "your-admin@domain.com",
  "ADMIN_PASSWORD": "YOUR_STRONG_PASSWORD",
  "MAX_FILE_SIZE_MB": "100",
  "MAX_BATCH_SIZE": "1000",
  "SUPPORTED_IMAGE_TYPES": "jpeg,jpg,png,webp",
  "SUPPORTED_VIDEO_TYPES": "mp4,mov,avi",
  "IMAGE_QUALITY_WEBP": "85",
  "IMAGE_QUALITY_JPEG": "90",
  "VIDEO_THUMBNAIL_TIME": "1",
  "CDN_CACHE_TTL": "31536000"
}
```

## 🔍 Verification Steps

### 1. Check Environment Variables in Vercel Dashboard
- All required variables are set
- No variables show `[REDACTED]` unexpectedly
- Production vs Preview environments configured correctly

### 2. Test Deployment
```bash
# Deploy and test
vercel --prod
```

### 3. Verify Runtime Environment
After deployment, check the app logs for:
- Database connections successful
- Authentication working
- File upload limits correct
- No missing environment variable errors

## 🚨 Security Best Practices

### Environment Variable Naming
- ✅ `NEXT_PUBLIC_*` for client-side variables only
- ✅ No `NEXT_PUBLIC_` prefix for sensitive data
- ✅ Use descriptive but not revealing names

### Sensitive Data Protection
- ✅ Service role keys are server-side only
- ✅ Admin passwords are strong and unique
- ✅ NextAuth secrets are cryptographically random
- ✅ No hardcoded secrets in code

### Access Control
- ✅ Limit team member access to production variables
- ✅ Use preview environments for testing
- ✅ Regular rotation of sensitive credentials

## 🔄 Environment Variable Updates

### When to Update
- After credential rotation
- When changing domains
- When updating third-party services
- During security incidents

### How to Update
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click the variable to edit
3. Update the value
4. Click "Save"
5. Redeploy the application for changes to take effect

### Bulk Update
```bash
# Update multiple variables
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

## 📞 Support

### Vercel Documentation
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [CLI Reference](https://vercel.com/docs/cli)

### Troubleshooting
- **Build fails:** Check all required variables are set
- **Runtime errors:** Verify variable names match code expectations
- **Auth issues:** Ensure `NEXTAUTH_URL` matches deployment URL
- **Database errors:** Verify Supabase credentials are correct and rotated

---

🎯 **Next Steps After Setup:**
1. Deploy to Vercel with new environment variables
2. Test admin login with new credentials
3. Verify file upload functionality
4. Monitor for any runtime errors
5. Set up monitoring and alerting