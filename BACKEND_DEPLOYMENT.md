# 🚀 Backend API Deployment Guide

The frontend is deployed on Netlify, but it needs the backend API to function. Here are the easiest deployment options:

---

## 🎯 Option 1: Render.com (RECOMMENDED - Free Tier)

### Step 1: Prepare Repository
```bash
cd /Users/tanisbedia/PS-05
git add apps/api/render.yaml
git commit -m "Add Render.com deployment config"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo: `Tanish01234/enterprise-intelligence`
5. Configure:
   - **Name:** synora-api
   - **Root Directory:** `apps/api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free

### Step 3: Add Environment Variables
In Render dashboard, add these:

```bash
DATABASE_URL=sqlite+aiosqlite:///./data/synora.db
DUCKDB_PATH=./data/analytics.duckdb
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRY=3600
CORS_ORIGINS=["*"]
APP_ENV=production
LOG_LEVEL=info

# Supabase (optional)
SUPABASE_URL=https://pbuvixxtexovvemizhws.supabase.co
SUPABASE_ANON_KEY=your-key-here

# AI API Keys (optional for demo)
GOOGLE_GEMINI_API_KEY=your-key-here
```

### Step 4: Upload Database
After deployment, upload the SQLite database:
1. Go to Render dashboard → Shell
2. Upload `apps/api/data/synora.db` using their file manager
3. Or use persistent disk (paid feature)

### Step 5: Update Netlify Environment
In Netlify dashboard, update:
```
NEXT_PUBLIC_API_URL=https://synora-api.onrender.com
```

---

## 🎯 Option 2: Railway.app (Also Free)

### Step 1: Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd apps/api
railway init
railway up
```

### Step 2: Add Environment Variables
Same as Render (above)

### Step 3: Get API URL
```bash
railway domain
# Copy the URL
```

### Step 4: Update Netlify
Set `NEXT_PUBLIC_API_URL` to Railway URL

---

## 🎯 Option 3: Local Backend + Ngrok (Testing Only)

### Step 1: Run Backend Locally
```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 2: Expose with Ngrok
```bash
ngrok http 8000
# Copy the https URL
```

### Step 3: Update Netlify
Set `NEXT_PUBLIC_API_URL` to ngrok URL

---

## ⚠️ IMPORTANT: Database File

The SQLite database (`synora.db` with 100K records) needs to be uploaded to wherever you deploy the backend.

### For Render/Railway:
1. Deploy first
2. Access shell/terminal
3. Upload or create the database:
```bash
cd /opt/render/project/src/data
# Upload synora.db here
```

Or re-run the data loader on the server:
```bash
python3 scripts/load_demo_data_sqlite.py
```

---

## ✅ Verification Checklist

After backend deployment:

- [ ] Backend API is live (visit `https://your-api.onrender.com/docs`)
- [ ] Netlify `NEXT_PUBLIC_API_URL` updated
- [ ] Demo login works: demo@synora.ai / Synora@2026
- [ ] Dashboard loads with real KPIs
- [ ] Analytics shows charts
- [ ] AI Queries responds

---

## 🆘 Quick Fix: Use Mock Backend (Temporary)

If deployment is taking too long, you can temporarily use mock responses in frontend:

In `apps/web/src/lib/api-client.ts`, add fallback:
```typescript
if (!response.ok && isDemoMode) {
  return { success: true, data: mockDemoData }
}
```

---

## 📊 Current Status

✅ Frontend: Deployed on Netlify (or deploying now)
⏳ Backend: Needs deployment (Render/Railway/etc)
✅ Database: Ready with 100K records
✅ Demo credentials: Visible on sign-in page

---

## 🎯 Recommended Path for Judges

**For Hackathon Demo:**
1. Deploy backend on Render (10 minutes)
2. Upload database file
3. Update Netlify env variable
4. Test demo login
5. Show to judges! 🎉

**Backend URL will be:**
- Render: `https://synora-api.onrender.com`
- Railway: `https://synora-api.up.railway.app`

Good luck! 🚀
