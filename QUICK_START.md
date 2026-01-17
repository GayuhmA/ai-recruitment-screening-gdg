# 🚀 Quick Start Guide

## ✅ Configuration Complete!

Your frontend is now fully configured and ready to use.

## 📋 Configuration Summary

### Environment Variables ✅
```
✓ .env.local exists
✓ NEXT_PUBLIC_API_URL = http://127.0.0.1:3001
✓ NEXTAUTH_URL = http://localhost:3000
✓ NEXTAUTH_SECRET = (set)
✓ Google OAuth configured
```

### Dependencies ✅
```
✓ node_modules installed
✓ next installed
✓ react installed
✓ @tanstack/react-query installed
✓ next-auth installed
✓ sonner installed
```

### Features Implemented ✅
```
✓ API Client with authentication
✓ Type-safe hooks for all entities
✓ React Query state management
✓ Toast notifications (Sonner)
✓ File upload with progress
✓ Real-time CV processing monitoring
✓ Protected routes with NextAuth
✓ Google OAuth integration
```

---

## 🎯 How to Start

### Option 1: Quick Start (Recommended)
Run this single command to start everything:

```powershell
# Start backend first (in another terminal)
cd path/to/backend
npm run start:dev

# Then start frontend (in this directory)
npm run dev
```

### Option 2: Verify Configuration First
```powershell
# 1. Check configuration
.\check-config.ps1

# 2. Start backend (if not running)
# Open new terminal, navigate to backend directory
npm run start:dev

# 3. Start frontend
npm run dev

# 4. Open browser
Start-Process http://localhost:3000
```

---

## 🌐 URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | Ready to start |
| Backend API | http://127.0.0.1:3001 | Need to start |
| API Health | http://127.0.0.1:3001/health | Check backend |

---

## 📝 First Time Setup

If this is your first time:

```powershell
# 1. Install dependencies (if not done)
npm install

# 2. Verify configuration
.\check-config.ps1

# 3. Start development server
npm run dev
```

---

## 🧪 Test the Integration

Once both servers are running:

### 1. Test Authentication
1. Open http://localhost:3000/login
2. Try Google OAuth or email/password login
3. Should redirect to dashboard on success

### 2. Test Job Creation
1. Navigate to http://localhost:3000/jobs
2. Click "Create Job" button
3. Fill out the form and submit
4. Should see success toast: "Job created successfully"

### 3. Test CV Upload
1. Open a job detail page
2. Click "Upload CV" button
3. Select a PDF file
4. Watch progress bar (0-100%)
5. See processing status update in real-time

### 4. Test Toast Notifications
All operations should show toast notifications:
- ✅ Success: Green toast with description
- ❌ Error: Red toast with error message

---

## 🔧 Troubleshooting

### Backend Connection Failed
```powershell
# Check if backend is running
curl http://127.0.0.1:3001/health

# If not, start it
cd path/to/backend
npm run start:dev
```

### Frontend Not Loading
```powershell
# Clear cache and restart
Remove-Item -Recurse -Force .next
npm run dev
```

### Environment Variables Not Working
```powershell
# Restart dev server (environment changes need restart)
# Press Ctrl+C to stop
npm run dev
```

### Port Already in Use
```powershell
# Kill process on port 3000
npx kill-port 3000

# Or use different port
$env:PORT=3001; npm run dev
```

---

## 📚 Documentation

- **Integration Guide:** [FRONTEND_BACKEND_INTEGRATION.md](./FRONTEND_BACKEND_INTEGRATION.md)
- **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Environment Config:** [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md)
- **What Was Fixed:** [WHAT_WAS_FIXED.md](./WHAT_WAS_FIXED.md)
- **API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## ✅ Ready Checklist

Before testing, make sure:

- [ ] `.env.local` exists with correct values
- [ ] `npm install` completed successfully
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 3000
- [ ] Browser opened to http://localhost:3000

---

## 🎉 You're All Set!

Your frontend is configured and ready to connect to the backend.

**Next command:**
```powershell
npm run dev
```

Then open http://localhost:3000 and start testing! 🚀

---

**Need help?** Refer to the documentation files or run `.\check-config.ps1` to verify your setup.
