# Environment Configuration Guide

## ✅ Configuration Status

### Current Setup
Your frontend is now properly configured to connect to the backend at:
```
Backend API: http://127.0.0.1:3001
Frontend App: http://localhost:3000
```

## 📁 Environment Files

### `.env.local` (Active Configuration)
✅ **File Location:** `c:\Users\OMEN\ai-recruitment-backend\.env.local`

**Current Configuration:**
```env
# Backend API
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=5he22IPF/d4L8eyKCpcVn+f4FTuBfYqRJK8a/EoEM90=

# Google OAuth
GOOGLE_CLIENT_ID=916243300407-hic6a7tqjd8p9ikrucuc3savrq5n2cfq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Mode
NODE_ENV=development
```

### `.env.example` (Template)
✅ **File Location:** `c:\Users\OMEN\ai-recruitment-backend\.env.example`

This file serves as a template for other developers.

### `.gitignore`
✅ **Protection Status:** `.env.local` is already in `.gitignore`

Your sensitive credentials are safe and won't be committed to Git.

## 🔧 How It Works

### 1. API Client Configuration
**File:** `src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
```

The API client automatically reads `NEXT_PUBLIC_API_URL` from your environment variables.

### 2. NextAuth Configuration
**File:** `src/lib/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ... other providers
  ],
  // ... other config
};
```

NextAuth reads `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and OAuth credentials automatically.

## ✅ Verification Steps

### Step 1: Check Environment Variables
```powershell
# In PowerShell terminal
cat .env.local
```

Should show:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>
```

### Step 2: Test Backend Connection
```powershell
# Test if backend is running
curl http://127.0.0.1:3001/health
```

Expected response:
```json
{"status":"ok"}
```

### Step 3: Start Frontend
```powershell
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environment:  development

✓ Ready in 2.5s
```

### Step 4: Verify API Connection
Open browser console on http://localhost:3000 and check:

```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should output: http://127.0.0.1:3001
```

## 🔍 Environment Variables Explained

### Required Variables

#### `NEXT_PUBLIC_API_URL`
- **Purpose:** Backend API base URL
- **Value:** `http://127.0.0.1:3001`
- **Note:** The `NEXT_PUBLIC_` prefix makes it available in browser
- **Usage:** All API calls in `src/lib/api.ts`

#### `NEXTAUTH_SECRET`
- **Purpose:** Encryption key for JWT tokens
- **Value:** Random 32-byte string (already set)
- **Security:** ⚠️ Must be changed in production!
- **Generate New:** `openssl rand -base64 32`

#### `NEXTAUTH_URL`
- **Purpose:** Frontend URL for OAuth callbacks
- **Value:** `http://localhost:3000`
- **Production:** Change to your production domain

### Optional Variables

#### `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- **Purpose:** Google OAuth authentication
- **Status:** ✅ Already configured
- **Usage:** Login with Google button
- **Get Credentials:** https://console.cloud.google.com/apis/credentials

#### `NODE_ENV`
- **Purpose:** Environment mode
- **Value:** `development` (local) or `production` (deployed)
- **Auto-set:** Next.js sets this automatically

## 🚀 Different Environments

### Development (Current)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
NEXTAUTH_URL=https://app.yourcompany.com
NODE_ENV=production
NEXTAUTH_SECRET=<generate-new-secure-secret>
```

### Staging
```env
NEXT_PUBLIC_API_URL=https://api-staging.yourcompany.com
NEXTAUTH_URL=https://app-staging.yourcompany.com
NODE_ENV=production
```

## 🛠️ Troubleshooting

### Problem: "Failed to fetch" errors

**Cause:** Backend not running or wrong URL

**Solution:**
```powershell
# 1. Check backend is running
curl http://127.0.0.1:3001/health

# 2. Verify .env.local
cat .env.local | Select-String "NEXT_PUBLIC_API_URL"

# 3. Restart frontend (environment changes require restart)
# Press Ctrl+C in terminal running npm run dev
npm run dev
```

### Problem: "Unauthorized" on all requests

**Cause:** NextAuth not configured or backend not accepting tokens

**Solution:**
```powershell
# 1. Check NEXTAUTH_SECRET is set
cat .env.local | Select-String "NEXTAUTH_SECRET"

# 2. Clear browser storage
# Open DevTools > Application > Storage > Clear site data

# 3. Login again
```

### Problem: Google OAuth not working

**Cause:** Missing or invalid Google OAuth credentials

**Solution:**
```powershell
# 1. Check credentials are set
cat .env.local | Select-String "GOOGLE_CLIENT"

# 2. Verify in Google Console
# https://console.cloud.google.com/apis/credentials

# 3. Check Authorized redirect URIs include:
# http://localhost:3000/api/auth/callback/google
```

### Problem: Environment variables not updating

**Cause:** Next.js caches environment variables

**Solution:**
```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Delete .next cache
Remove-Item -Recurse -Force .next

# 3. Restart dev server
npm run dev
```

## 📝 Configuration Checklist

- [x] `.env.local` file exists
- [x] `NEXT_PUBLIC_API_URL` points to backend (http://127.0.0.1:3001)
- [x] `NEXTAUTH_SECRET` is set
- [x] `NEXTAUTH_URL` matches frontend URL (http://localhost:3000)
- [x] Google OAuth credentials configured (optional)
- [x] `.gitignore` includes `.env.local`
- [x] `.env.example` exists as template

## 🔐 Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore`
- Use different secrets for dev/staging/production
- Generate secure random strings for `NEXTAUTH_SECRET`
- Rotate secrets regularly in production
- Use environment variables for all sensitive data

### ❌ DON'T:
- Commit `.env.local` to Git
- Share your `.env.local` file
- Use default secrets in production
- Hardcode API URLs in source code
- Expose backend URLs publicly

## 📚 Additional Resources

### Generate Secure Secret
```powershell
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Or use OpenSSL (if installed)
openssl rand -base64 32
```

### Test API Connection
```powershell
# Health check
curl http://127.0.0.1:3001/health

# Test login endpoint
curl http://127.0.0.1:3001/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password"}'
```

### Environment Variables in Code

```typescript
// ✅ CORRECT: Available in browser (NEXT_PUBLIC_ prefix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ WRONG: Only available server-side
const secret = process.env.NEXTAUTH_SECRET; // undefined in browser

// ✅ CORRECT: Available everywhere
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
};
```

## 🎯 Quick Start Commands

```powershell
# 1. Check configuration
cat .env.local

# 2. Verify backend is running
curl http://127.0.0.1:3001/health

# 3. Start frontend
npm run dev

# 4. Open browser
Start-Process http://localhost:3000

# 5. Test login
# Navigate to http://localhost:3000/login
```

## ✅ Configuration Complete!

Your frontend is now properly configured and ready to connect to the backend.

**Next Steps:**
1. Start backend server: `npm run start:dev` (in backend directory)
2. Start frontend server: `npm run dev` (in frontend directory)
3. Open http://localhost:3000
4. Test login and API operations

Refer to [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

---

**Status:** ✅ **CONFIGURED**  
**Backend:** http://127.0.0.1:3001  
**Frontend:** http://localhost:3000  
**Last Updated:** January 16, 2026
