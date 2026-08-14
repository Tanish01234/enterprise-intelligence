# Authentication Flow Testing Guide

## Prerequisites

### 1. Start Backend
```bash
cd apps/api
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Start Frontend
```bash
cd apps/web
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

### 3. Verify Backend Health
Open: http://localhost:8000/health

**Expected Response:**
```json
{
  "status": "healthy"
}
```

---

## Test Scenarios

### ✅ Scenario 1: New User Signup

**Steps:**
1. Open http://localhost:3000
2. Click "Get Started" or navigate to http://localhost:3000/auth/signup
3. Fill in the form:
   - **Full Name:** John Doe
   - **Work Email:** john.doe@example.com
   - **Company Name:** Acme Inc.
   - **Password:** SecurePass123!
   - **Check:** ✅ I agree to the Terms and Privacy Policy
4. Click "Create Account"

**Expected Behavior:**
- Loading spinner appears
- Network request to `POST /api/v1/auth/signup` visible in DevTools Network tab
- Success toast: "Account created successfully!"
- Redirect to `/onboarding/organization`
- Browser cookies set:
  - `auth_token` (JWT token)
- LocalStorage contains:
  - `access_token` (JWT token)
  - `refresh_token` (if provided by Supabase)

**DevTools Verification:**
```javascript
// Console
localStorage.getItem('access_token')  // Should show JWT
document.cookie  // Should contain auth_token

// Network Tab
Request URL: http://localhost:8000/api/v1/auth/signup
Request Method: POST
Status Code: 200 OK
Response: { success: true, user: {...}, session: {...} }
```

---

### ✅ Scenario 2: Organization Setup

**Steps:**
1. After signup, you should be on `/onboarding/organization`
2. Fill in:
   - **Organization Name:** Acme Corporation
   - **Industry:** Technology
   - **Team Size:** 11-50
3. Click "Continue"

**Expected Behavior:**
- Loading spinner appears
- Success toast: "Organization created!"
- Redirect to `/onboarding/workspace`
- Cookie `has_organization=true` is set

**DevTools Verification:**
```javascript
// Console
document.cookie.includes('has_organization=true')  // Should be true
```

---

### ✅ Scenario 3: Workspace Setup

**Steps:**
1. After org setup, you should be on `/onboarding/workspace`
2. Fill in:
   - **Workspace Name:** Marketing Team
   - **Description:** Marketing analytics workspace
   - **Template:** Select "Marketing"
3. Click "Create Workspace"

**Expected Behavior:**
- Loading spinner appears
- Success toast: "Workspace created!"
- Redirect to `/app/dashboard`
- Cookie `has_workspace=true` is set

**DevTools Verification:**
```javascript
// Console
document.cookie.includes('has_workspace=true')  // Should be true
window.location.pathname  // Should be '/app/dashboard'
```

---

### ✅ Scenario 4: Existing User Signin

**Steps:**
1. Open http://localhost:3000/auth/signin
2. Enter credentials from Scenario 1:
   - **Email:** john.doe@example.com
   - **Password:** SecurePass123!
   - **Optional:** ✅ Remember me (keeps cookies for 7 days)
3. Click "Sign In"

**Expected Behavior:**
- Loading spinner appears
- Network request to `POST /api/v1/auth/signin` visible
- Success toast: "Welcome back!"
- Direct redirect to `/app/dashboard` (skips onboarding)
- All cookies set (auth_token, has_organization, has_workspace)

**DevTools Verification:**
```javascript
// Network Tab
Request URL: http://localhost:8000/api/v1/auth/signin
Request Method: POST
Status Code: 200 OK
Response: { success: true, user: {...}, session: {...} }
```

---

### ✅ Scenario 5: Protected Route Access

**Steps:**
1. While logged in, navigate to various routes:
   - http://localhost:3000/app/dashboard ✅ Accessible
   - http://localhost:3000/app/analytics ✅ Accessible
   - http://localhost:3000/dashboard ✅ Accessible
2. Open DevTools > Application > Cookies
3. Manually delete `auth_token` cookie
4. Try to access http://localhost:3000/app/dashboard

**Expected Behavior:**
- With auth_token: Page loads successfully
- Without auth_token: Automatic redirect to `/auth/signin`

---

### ✅ Scenario 6: Logout Flow

**Steps:**
1. While logged in at `/app/dashboard`
2. Click on user avatar (bottom left)
3. Click "Sign Out"

**Expected Behavior:**
- Redirect to `/auth/signout` page
- Page shows: "Signing you out..." with loading animation
- Network request to `POST /api/v1/auth/signout` visible
- After ~1 second, redirect to landing page `/`
- All cookies cleared
- LocalStorage cleared

**DevTools Verification:**
```javascript
// Console (after signout completes)
localStorage.getItem('access_token')  // Should be null
localStorage.getItem('refresh_token')  // Should be null
document.cookie  // Should not contain auth_token

// Network Tab
Request URL: http://localhost:8000/api/v1/auth/signout
Request Method: POST
Status Code: 200 OK
```

**Post-Logout Test:**
- Try accessing http://localhost:3000/app/dashboard
- Should redirect to `/auth/signin`

---

### ✅ Scenario 7: Invalid Credentials

**Steps:**
1. Navigate to http://localhost:3000/auth/signin
2. Enter invalid credentials:
   - **Email:** wrong@example.com
   - **Password:** WrongPassword123!
3. Click "Sign In"

**Expected Behavior:**
- Loading spinner appears
- Network request to backend
- Error toast appears: "Invalid email or password" (or backend error message)
- User stays on signin page
- No cookies or tokens set

---

### ✅ Scenario 8: Middleware Protection

**Test A: No Auth Token**
```bash
1. Clear all cookies and localStorage
2. Navigate to http://localhost:3000/app/dashboard
3. Expected: Redirect to /auth/signin
```

**Test B: Auth Token but No Organization**
```bash
1. Sign in successfully
2. Open DevTools > Application > Cookies
3. Delete has_organization cookie
4. Navigate to http://localhost:3000/app/dashboard
5. Expected: Redirect to /onboarding/organization
```

**Test C: Auth Token + Org but No Workspace**
```bash
1. Sign in successfully
2. Delete has_workspace cookie
3. Navigate to http://localhost:3000/app/dashboard
4. Expected: Redirect to /onboarding/workspace
```

**Test D: Accessing Auth Pages When Logged In**
```bash
1. Sign in successfully
2. Navigate to http://localhost:3000/auth/signin
3. Expected: Redirect to /app/dashboard
```

---

## Common Issues & Solutions

### Issue: "Network Error" or CORS Error

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/v1/auth/signin' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend CORS settings
# File: apps/api/app/core/config.py
CORS_ORIGINS: List[str] = ["http://localhost:3000"]

# Restart backend
cd apps/api
uvicorn app.main:app --reload --port 8000
```

---

### Issue: "Invalid credentials" with correct password

**Symptoms:**
- Correct email/password but getting error

**Solution:**
```bash
# 1. Check Supabase connection
# File: apps/api/.env
SUPABASE_URL=https://pbuvixxtexovvemizhws.supabase.co
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key

# 2. Test Supabase directly in backend logs
cd apps/api
python
>>> from app.services.supabase_auth import supabase_auth_service
>>> # Check if it initializes without errors

# 3. Check backend logs for detailed error
```

---

### Issue: Redirect Loop

**Symptoms:**
- Browser keeps redirecting between pages

**Solution:**
```javascript
// 1. Clear all browser data
// DevTools > Application > Clear Storage > Clear site data

// 2. Hard refresh
// Mac: Cmd + Shift + R
// Windows: Ctrl + Shift + R

// 3. Verify middleware logic
// File: apps/web/src/middleware.ts
// Ensure signout is in publicRoutes
```

---

### Issue: Token Not Persisting

**Symptoms:**
- Login successful but immediate redirect to signin

**Solution:**
```javascript
// 1. Check cookie settings
// DevTools > Application > Cookies
// Verify auth_token exists with correct domain and path

// 2. Check localStorage
localStorage.getItem('access_token')  // Should not be null

// 3. Verify apiClient is setting token
// File: apps/web/src/lib/api-client.ts
// Check setToken() method
```

---

### Issue: Backend Not Starting

**Symptoms:**
```bash
ModuleNotFoundError: No module named 'supabase'
```

**Solution:**
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## Success Criteria Checklist

### Authentication Flow ✅
- [ ] Signup creates account in Supabase
- [ ] Signin authenticates with Supabase
- [ ] JWT tokens stored in localStorage
- [ ] Auth cookies set with proper expiry
- [ ] Signout clears all auth data

### Protected Routes ✅
- [ ] Cannot access /app/* without auth
- [ ] Middleware redirects to /auth/signin
- [ ] Organization check works
- [ ] Workspace check works
- [ ] Onboarding flow preserved

### User Experience ✅
- [ ] Loading states show during API calls
- [ ] Error messages are clear and helpful
- [ ] Success toasts appear
- [ ] Smooth redirects
- [ ] No console errors

### Backend Integration ✅
- [ ] All API calls reach backend
- [ ] Supabase authentication works
- [ ] Proper error responses
- [ ] Session management works
- [ ] Token refresh available (endpoint exists)

---

## Testing Checklist

```
☐ 1. Fresh signup flow
☐ 2. Organization setup
☐ 3. Workspace setup  
☐ 4. Signin with existing account
☐ 5. Access protected routes
☐ 6. Logout flow
☐ 7. Try invalid credentials
☐ 8. Test middleware protection
☐ 9. Clear cookies and retry access
☐ 10. Check all tokens stored correctly
```

---

## Quick Test Script

```bash
# Terminal 1: Start Backend
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend  
cd apps/web && npm run dev

# Terminal 3: Run tests
curl http://localhost:8000/health  # Should return {"status":"healthy"}
curl http://localhost:3000  # Should return HTML
```

---

## Browser DevTools Commands

```javascript
// Check authentication state
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Cookies:', document.cookie);

// Manually clear auth (for testing)
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();

// Check if authenticated
const hasAuth = document.cookie.includes('auth_token=');
console.log('Is Authenticated:', hasAuth);
```

---

## Performance Benchmarks

**Expected Response Times:**
- Signup: 500-1500ms (Supabase processing)
- Signin: 300-800ms (Supabase auth)
- Signout: 100-300ms (local cleanup + backend call)
- Protected route check: <50ms (middleware)

---

## Next Steps After Verification

Once all tests pass:
1. ✅ Test with real Supabase account creation
2. ✅ Verify email/password validation
3. ✅ Test "Remember me" functionality
4. ✅ Test token expiry (wait 7 days or manually expire)
5. ✅ Implement automatic token refresh
6. ✅ Add OAuth (Google, GitHub)
7. ✅ Add password reset flow
8. ✅ Connect organization/workspace to real APIs

---

**Happy Testing! 🚀**
