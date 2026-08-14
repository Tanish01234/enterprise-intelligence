# Quick Start - Authentication Testing

## 🚀 Start Servers (2 terminals)

### Terminal 1: Backend
```bash
cd apps/api
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd apps/web
npm run dev
```

---

## ✅ Test in 60 Seconds

### 1. Signup (15 sec)
```
1. Open http://localhost:3000/auth/signup
2. Fill form with any data
3. Click "Create Account"
4. Should see: /onboarding/organization
```

### 2. Complete Onboarding (15 sec)
```
1. Fill organization form → Continue
2. Fill workspace form → Create Workspace
3. Should see: /app/dashboard with real UI
```

### 3. Logout (10 sec)
```
1. Click user avatar (bottom left)
2. Click "Sign Out"
3. Should redirect to landing page
```

### 4. Signin (10 sec)
```
1. Go to http://localhost:3000/auth/signin
2. Enter same email/password from step 1
3. Click "Sign In"
4. Should see: /app/dashboard directly
```

### 5. Verify Protection (10 sec)
```
1. Open DevTools (F12)
2. Application > Cookies > Delete auth_token
3. Refresh page
4. Should redirect to: /auth/signin
```

---

## 🔍 Verify Authentication

### Browser Console
```javascript
// Check tokens
localStorage.getItem('access_token')  // Should show JWT
document.cookie  // Should contain auth_token

// Check protection
window.location.pathname  // Should be /app/dashboard
```

### Network Tab (DevTools)
```
POST /api/v1/auth/signup → 200 OK
POST /api/v1/auth/signin → 200 OK  
POST /api/v1/auth/signout → 200 OK
```

---

## 🐛 Troubleshooting

### Backend Not Running?
```bash
# Check if port 8000 is in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill and restart
kill -9 <PID>  # Mac/Linux
uvicorn app.main:app --reload --port 8000
```

### Frontend Not Running?
```bash
# Clear cache and restart
rm -rf .next
npm run dev
```

### CORS Error?
```bash
# Check backend config
# File: apps/api/app/core/config.py
# Should have: CORS_ORIGINS = ["http://localhost:3000"]
```

### "Invalid credentials"?
```bash
# Check Supabase config
# File: apps/api/.env
# Verify SUPABASE_URL and keys are correct
```

---

## ✨ What Changed

**Before:**
```typescript
document.cookie = 'auth_token=mock_token; path=/'  // ❌ Fake
```

**After:**
```typescript
const response = await apiClient.auth.signIn(email, password)  // ✅ Real
apiClient.setToken(response.data.session.access_token)
document.cookie = `auth_token=${response.data.session.access_token}; path=/`
```

---

## 📊 Success Indicators

✅ Signup creates real Supabase user  
✅ Signin returns JWT token  
✅ Dashboard only accessible with token  
✅ Logout clears all auth data  
✅ Middleware redirects work  

---

## 🎯 Quick Commands

```bash
# Clear browser auth
localStorage.clear(); 
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
location.reload();

# Check health
curl http://localhost:8000/health

# Test signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'
```

---

**Ready to test! 🚀**
