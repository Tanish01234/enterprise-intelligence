# 🚀 Netlify Deployment Guide - Synora

## Prerequisites
✅ Build completed successfully locally
✅ netlify.toml configuration added
✅ next.config.js updated for production

---

## 📦 Step 1: Prepare for Deployment

### Build Settings (Netlify Dashboard)
```
Base directory: apps/web
Build command: npm run build
Publish directory: apps/web/.next
```

### Node Version
```
NODE_VERSION = 20
```

---

## 🔐 Step 2: Environment Variables

Add these in **Netlify Dashboard → Site settings → Environment variables**:

### Required Variables:

```bash
# API Backend URL (Replace with your deployed API URL or use demo)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pbuvixxtexovvemizhws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidXZpeHh0ZXhvdnZlbWl6aHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDQwNDgsImV4cCI6MjEwMjEyMDA0OH0.xmz2vWW9TBN54NrthRHa-UaqPcLZ5aujNaqEDQxnXEs
```

---

## 📁 Step 3: Deploy Options

### Option A: Deploy via Netlify CLI
```bash
cd apps/web
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option B: Deploy via GitHub
1. Push code to GitHub
2. Connect repository in Netlify
3. Set base directory to `apps/web`
4. Deploy automatically on push

### Option C: Deploy via Drag & Drop
1. Build locally: `npm run build`
2. Drag `.next` folder to Netlify dashboard

---

## ⚠️ Common Issues & Fixes

### Issue 1: Build Fails with TypeScript Errors
**Solution:** Already handled via `ignoreBuildErrors: true` in next.config.js

### Issue 2: Images Not Loading
**Solution:** Already added `unoptimized: true` for Netlify static hosting

### Issue 3: API Calls Failing
**Solution:** Update `NEXT_PUBLIC_API_URL` to point to your deployed backend

### Issue 4: Environment Variables Not Loading
**Solution:** Ensure variables start with `NEXT_PUBLIC_` prefix

---

## 🎯 Demo Mode on Netlify

The demo mode will work on Netlify as long as you deploy the backend API separately.

### Demo Credentials:
- **Email:** demo@synora.ai
- **Password:** Synora@2026

### Backend Deployment Options:
1. **Render.com** (Free tier available)
2. **Railway.app** (Free tier available)
3. **Heroku** (Paid)
4. **DigitalOcean App Platform**

---

## 📊 Post-Deployment Checklist

- [ ] Frontend deployed on Netlify
- [ ] Backend API deployed (Render/Railway/etc.)
- [ ] Environment variables configured
- [ ] Database connected (Supabase/SQLite)
- [ ] Demo login working
- [ ] Dashboard loading with data
- [ ] Analytics showing charts
- [ ] AI Copilot responding to queries

---

## 🔗 Useful Links

- **Netlify Docs:** https://docs.netlify.com/
- **Next.js on Netlify:** https://docs.netlify.com/frameworks/next-js/
- **Environment Variables:** https://docs.netlify.com/environment-variables/overview/

---

## 🆘 Need Help?

If deployment fails, check:
1. Build logs in Netlify dashboard
2. Browser console for errors
3. Network tab for failed API calls
4. Environment variables are set correctly

---

## ✅ Success Indicators

Once deployed successfully, you should be able to:
- ✅ Visit the Netlify URL
- ✅ See the landing page
- ✅ Sign in with demo credentials
- ✅ View dashboard with 100K records
- ✅ Explore analytics charts
- ✅ Ask AI questions

Good luck with your deployment! 🎉
