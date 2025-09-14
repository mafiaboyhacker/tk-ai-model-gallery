# 🛡️ SECURE DEPLOYMENT CHECKLIST

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Credential Rotation (CRITICAL - Do First)

**Supabase Credentials - EXPOSED AND MUST BE ROTATED:**
```
Current Project: hjovusgefakpcwghoixk.supabase.co
Status: COMPROMISED - Visible in .env.local
```

**Steps to Rotate Supabase Credentials:**
1. Login to Supabase Dashboard (https://supabase.com/dashboard)
2. Navigate to: Project Settings > API
3. Click "Reset" next to both keys:
   - Reset Anon (public) key
   - Reset Service Role (private) key ⚠️ CRITICAL
4. Update all environments immediately:
   - Local development (.env.local)
   - Vercel production environment variables
   - Any other deployed instances

### 2. Generate Strong Secrets

**NextAuth Secret:**
```bash
# Generate secure random string
openssl rand -base64 32
# Or use online generator: https://generate-secret.vercel.app/32
```

**Admin Password:**
- Minimum 16 characters
- Include: uppercase, lowercase, numbers, symbols
- Use password manager to generate
- Example pattern: `Kp9$mL2@nQ5&xR8#vT1!`

## 🔒 PRE-DEPLOYMENT SECURITY CHECKLIST

### Environment Security
- [ ] All credentials rotated after exposure
- [ ] Strong NextAuth secret generated (32+ characters)
- [ ] Strong admin password set (16+ characters)
- [ ] No placeholder values in production environment
- [ ] .env.local removed from git history (if committed)
- [ ] Supabase RLS policies configured correctly

### Vercel Deployment Security
- [ ] Environment variables set in Vercel Dashboard (not .env files)
- [ ] Production NEXTAUTH_URL matches actual domain
- [ ] NEXT_PUBLIC_ variables contain no sensitive data
- [ ] Deployment previews don't expose production data
- [ ] Domain configured with HTTPS only

### Database Security
- [ ] Supabase RLS (Row Level Security) enabled
- [ ] Admin role properly configured
- [ ] Test database connections work with new credentials
- [ ] Database backups configured
- [ ] SQL injection protection verified

### File Upload Security
- [ ] File size limits properly configured
- [ ] File type validation implemented
- [ ] Upload directory permissions secured
- [ ] Malicious file scanning considered
- [ ] Storage quotas monitored

## 📋 VERCEL ENVIRONMENT VARIABLES

### Required for Production Deployment

**Copy these to Vercel Dashboard > Settings > Environment Variables:**

```env
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_URL=https://your-domain.vercel.app

# Supabase (Use NEW credentials after rotation)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY

# Authentication
NEXTAUTH_SECRET=GENERATED_32_CHAR_SECRET

# Admin Setup
ADMIN_EMAIL=your-real-admin-email@domain.com
ADMIN_PASSWORD=YOUR_STRONG_GENERATED_PASSWORD

# File Processing
MAX_FILE_SIZE_MB=100
MAX_BATCH_SIZE=1000
SUPPORTED_IMAGE_TYPES=jpeg,jpg,png,webp
SUPPORTED_VIDEO_TYPES=mp4,mov,avi
IMAGE_QUALITY_WEBP=85
IMAGE_QUALITY_JPEG=90
VIDEO_THUMBNAIL_TIME=1
CDN_CACHE_TTL=31536000
```

## 🔍 SECURITY VERIFICATION STEPS

### Pre-Deployment Testing
1. **Local Environment Test:**
   ```bash
   # Test with new credentials
   npm run dev
   # Verify login works
   # Test file upload
   # Check database connections
   ```

2. **Credential Validation:**
   ```bash
   # Verify Supabase connection
   curl -H "Authorization: Bearer YOUR_NEW_ANON_KEY" \
        "https://YOUR_PROJECT_ID.supabase.co/rest/v1/"
   ```

3. **Security Headers Check:**
   ```bash
   # After deployment, verify security headers
   curl -I https://your-domain.vercel.app
   ```

### Post-Deployment Verification
- [ ] HTTPS redirect working
- [ ] Admin login functional with new credentials
- [ ] File upload working correctly
- [ ] Database operations functioning
- [ ] No credential exposure in browser dev tools
- [ ] Error messages don't leak sensitive information

## 🚨 INCIDENT RESPONSE

### If Credentials Are Already Compromised
1. **Immediate Actions:**
   - Rotate all Supabase keys immediately
   - Change admin password
   - Check Supabase logs for unauthorized access
   - Monitor for unusual database activity

2. **Cleanup Actions:**
   - Remove .env.local from git history if committed
   - Revoke any API tokens that may have been exposed
   - Update all team members with new credentials

3. **Prevention:**
   - Set up monitoring alerts
   - Regular credential rotation schedule
   - Team security training

## 📞 EMERGENCY CONTACTS

- **Supabase Support:** https://supabase.com/dashboard/support
- **Vercel Support:** https://vercel.com/help
- **Security Team:** [Add your security contact]

---

⚠️ **REMEMBER**: Never commit real credentials to version control. Always use environment variables for sensitive data.