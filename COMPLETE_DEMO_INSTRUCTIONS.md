# 🚀 COMPLETE DEMO MODE - FINAL INSTRUCTIONS

## CRITICAL: Data Must Be Loaded First

### Step 1: Load Demo Data (Required!)

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:[password]@[host]/postgres"

# Run the loader
chmod +x scripts/load_demo_data_simple.sh
./scripts/load_demo_data_simple.sh
```

This loads 100,000 rows into `public.demo_sales_data` table.

---

## Step 2: Update Dashboard to Use Demo Data

**File**: `apps/web/src/app/app/dashboard/page.tsx`

Replace the entire `loadDashboardData` function with:

```typescript
const loadDashboardData = async (forceRefresh: boolean = false) => {
  try {
    setLoading(true)
    setError(null)

    // Check if demo mode
    const isDemoMode = typeof window !== 'undefined' && 
      localStorage.getItem('is_demo_mode') === 'true'

    if (isDemoMode) {
      // Load demo data
      const kpisResponse = await apiClient.demo.dashboardKpis()
      const revenueResponse = await apiClient.demo.revenueTrend()
      const activityResponse = await apiClient.demo.activity()

      if (kpisResponse.success && kpisResponse.data) {
        const data = kpisResponse.data as any
        setKpis([
          { name: 'Total Revenue', value: `$${(data.total_revenue / 1000000).toFixed(1)}M`, change: '+12.5%', trend: 'up', icon: DollarSign },
          { name: 'Total Orders', value: data.total_orders.toLocaleString(), change: '+8.2%', trend: 'up', icon: Users },
          { name: 'Total Profit', value: `$${(data.total_profit / 1000000).toFixed(1)}M`, change: '+15.3%', trend: 'up', icon: Database },
          { name: 'Avg Order Value', value: `$${data.avg_order_value.toFixed(0)}`, change: '+5.1%', trend: 'up', icon: Activity },
        ])
      }

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data as any[])
      }

      if (activityResponse.success && activityResponse.data) {
        setActivityData(activityResponse.data as any[])
      }

      setLoading(false)
      return
    }

    // Regular user flow (existing code)
    // ... keep existing code for non-demo users
  } catch (err) {
    setError('Failed to load dashboard data')
    setLoading(false)
  }
}
```

---

## Step 3: Add Demo Banner

**New File**: `apps/web/src/components/DemoBanner.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/Button'

export function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const demoMode = localStorage.getItem('is_demo_mode') === 'true'
    setIsDemo(demoMode)
  }, [])

  if (!isDemo || !isVisible) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <span className="font-semibold">Demo Mode Active</span>
            <span className="hidden sm:inline text-sm opacity-90">
              • Exploring 100,000 enterprise sales records from 2025-2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signup">
            <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
              Sign Up Free
            </Button>
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Add to Layout**: `apps/web/src/app/app/layout.tsx`

```typescript
import { DemoBanner } from '@/components/DemoBanner'

// At the top of the main content
<>
  <DemoBanner />
  {/* existing content */}
</>
```

---

## Step 4: Update Analytics Page

**File**: `apps/web/src/app/app/analytics/page.tsx`

Add demo data loading in `useEffect`:

```typescript
useEffect(() => {
  const isDemoMode = localStorage.getItem('is_demo_mode') === 'true'
  
  if (isDemoMode) {
    loadDemoAnalytics()
  } else {
    // existing code
  }
}, [])

const loadDemoAnalytics = async () => {
  setLoading(true)
  try {
    const [kpis, regions, industries, products] = await Promise.all([
      apiClient.demo.dashboardKpis(),
      apiClient.demo.regions(),
      apiClient.demo.industries(),
      apiClient.demo.products(),
    ])

    // Transform and set data
    // ... (use the responses to populate charts)
    
    setLoading(false)
  } catch (error) {
    setLoading(false)
  }
}
```

---

## Step 5: Update AI Queries Page

**File**: `apps/web/src/app/app/queries/page.tsx`

Update the sendMessage function:

```typescript
const sendMessage = async () => {
  if (!input.trim()) return
  
  const userMessage = { role: 'user', content: input }
  setMessages(prev => [...prev, userMessage])
  setInput('')
  setLoading(true)
  
  try {
    const isDemoMode = localStorage.getItem('is_demo_mode') === 'true'
    
    if (isDemoMode) {
      const response = await apiClient.demo.aiQuery(input)
      if (response.success && response.data) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.answer,
          sql: response.data.sql,
          data: response.data.data
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } else {
      // existing non-demo code
    }
    
    setLoading(false)
  } catch (error) {
    setLoading(false)
  }
}
```

---

## Step 6: Update Datasets Page

**File**: `apps/web/src/app/app/datasets/page.tsx`

Show demo dataset:

```typescript
useEffect(() => {
  const isDemoMode = localStorage.getItem('is_demo_mode') === 'true'
  
  if (isDemoMode) {
    loadDemoDataset()
  } else {
    loadDatasets()
  }
}, [])

const loadDemoDataset = async () => {
  const response = await apiClient.demo.datasetInfo()
  if (response.success) {
    setDatasets([response.data])
  }
}
```

---

## Step 7: Update Team Page

**File**: `apps/web/src/app/app/team/page.tsx`

Show demo team:

```typescript
const demoTeam = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@synora.ai',
    role: 'Owner',
    avatar: 'DU',
    joined: '2025-01-01',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@synora.ai',
    role: 'Admin',
    avatar: 'SC',
    joined: '2025-01-15',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Michael Ross',
    email: 'michael@synora.ai',
    role: 'Analyst',
    avatar: 'MR',
    joined: '2025-02-01',
    status: 'Active'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma@synora.ai',
    role: 'Viewer',
    avatar: 'EW',
    joined: '2025-02-15',
    status: 'Active'
  }
]

// In component
const isDemoMode = localStorage.getItem('is_demo_mode') === 'true'
const teamData = isDemoMode ? demoTeam : members
```

---

## Step 8: Show Demo Email in Profile

**File**: `apps/web/src/app/app/layout.tsx`

Update user email display:

```typescript
const [userEmail, setUserEmail] = useState('')

useEffect(() => {
  const isDemoMode = localStorage.getItem('is_demo_mode') === 'true'
  if (isDemoMode) {
    setUserEmail('demo@synora.ai')
  } else {
    // load from API
  }
}, [])
```

---

## Verification Commands

After loading data and updating frontend:

### 1. Verify Data Loaded
```sql
SELECT COUNT(*) FROM public.demo_sales_data;
-- Should return: 100000

SELECT 
  SUM(total_sales) as revenue,
  COUNT(DISTINCT order_id) as orders
FROM public.demo_sales_data;
-- Should return actual numbers
```

### 2. Test Demo Login
1. Go to `/auth/signin`
2. Enter: demo@synora.ai / Synora@2026
3. Should see "Welcome to Synora Demo!" toast
4. Should redirect to `/app/dashboard`
5. Should see demo banner at top
6. Should see real KPIs from database

### 3. Test Each Page
- ✅ Dashboard - Shows real revenue, orders, profit
- ✅ Analytics - Shows regional/industry breakdowns
- ✅ AI Queries - Can ask questions, get SQL responses
- ✅ Datasets - Shows demo dataset (100K rows, read-only)
- ✅ Reports - Can export CSV
- ✅ Team - Shows 4 demo team members
- ✅ Settings - Shows demo@synora.ai email

---

## Common Issues

### Issue: "No data available"
**Fix**: Data not loaded. Run `load_demo_data_simple.sh`

### Issue: "Failed to load dashboard"
**Fix**: Check DATABASE_URL is set, backend is running

### Issue: Dashboard shows old mock data
**Fix**: Clear localStorage, re-login as demo user

### Issue: Demo banner not showing
**Fix**: Check localStorage has `is_demo_mode=true`

---

## Files That Need Updates

Priority order:

1. ✅ **Backend** - All done (demo.py, auth.py, main.py)
2. ✅ **API Client** - All done (api-client.ts)
3. ⚠️ **Dashboard** - Needs update (dashboard/page.tsx)
4. ⚠️ **Demo Banner** - Needs creation (DemoBanner.tsx)
5. ⚠️ **Layout** - Needs banner (app/layout.tsx)
6. ⚠️ **Analytics** - Needs demo data (analytics/page.tsx)
7. ⚠️ **AI Queries** - Needs demo endpoint (queries/page.tsx)
8. ⚠️ **Datasets** - Needs demo dataset (datasets/page.tsx)
9. ⚠️ **Team** - Needs demo team (team/page.tsx)

---

## Summary

**What's Done**:
- ✅ Demo authentication
- ✅ 9 demo API endpoints
- ✅ SQL queries for all data
- ✅ Data loading scripts
- ✅ API client methods
- ✅ Sign in integration

**What's Needed**:
- ⚠️ Load CSV data (run script)
- ⚠️ Update dashboard component
- ⚠️ Create demo banner
- ⚠️ Update analytics page
- ⚠️ Update AI queries page
- ⚠️ Update datasets page
- ⚠️ Update team page

**Estimated Time**: 2-3 hours for all frontend updates

The backend is 100% ready. Once you load the data and update the frontend components as shown above, the demo will be fully functional end-to-end.
