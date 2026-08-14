'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Users, Database, Activity, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '@/lib/api-client'

interface KPI {
  name: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
}

interface ChartDataPoint {
  [key: string]: any
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([])
  const [activityData, setActivityData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check demo mode
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('is_demo_mode') === 'true')
    }
    
    const shouldRefresh = searchParams.get('refresh') === 'true'
    loadDashboardData(shouldRefresh)
  }, [searchParams])

  const loadDashboardData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Check if in demo mode
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('is_demo_mode') === 'true'

      if (isDemoMode) {
        // Load demo data
        const kpisResponse = await apiClient.demo.dashboardKpis()
        if (kpisResponse.success && kpisResponse.data) {
          const demoKpis = kpisResponse.data as any
          setKpis([
            {
              name: 'Total Revenue',
              value: `$${(demoKpis.total_revenue / 1000000).toFixed(1)}M`,
              change: demoKpis.revenue_change || '+12.5%',
              trend: 'up',
              icon: DollarSign,
            },
            {
              name: 'Total Orders',
              value: demoKpis.total_orders?.toLocaleString() || '0',
              change: demoKpis.orders_change || '+8.2%',
              trend: 'up',
              icon: Database,
            },
            {
              name: 'Avg Order Value',
              value: `$${demoKpis.avg_order_value?.toFixed(0) || '0'}`,
              change: demoKpis.aov_change || '+5.1%',
              trend: 'up',
              icon: TrendingUp,
            },
            {
              name: 'Customer Satisfaction',
              value: `${demoKpis.avg_satisfaction?.toFixed(1) || '0'}/5`,
              change: demoKpis.satisfaction_change || '+0.3',
              trend: 'up',
              icon: Users,
            },
          ])
        }

        // Load demo revenue trend
        const revenueResponse = await apiClient.demo.revenueTrend()
        if (revenueResponse.success && revenueResponse.data) {
          setRevenueData(revenueResponse.data as ChartDataPoint[])
        }

        // Load demo activity
        const activityResponse = await apiClient.demo.activity()
        if (activityResponse.success && activityResponse.data) {
          setActivityData(activityResponse.data as ChartDataPoint[])
        }

        setLoading(false)
        return
      }

      // Regular mode - existing logic
      // Get first available dataset
      const datasetsResponse = await apiClient.datasets.list(0, 1)
      const datasetsData = datasetsResponse.data as { datasets?: any[]; total?: number } | undefined

      if (!datasetsResponse.success || !datasetsData?.datasets?.length) {
        setError('No datasets available. Upload a dataset to view analytics.')
        setLoading(false)
        return
      }

      const datasetId = datasetsData.datasets[0].id

      // Fetch KPIs
      const kpisResponse = await apiClient.analytics.calculateKpis(datasetId, [
        { name: 'Total Revenue', column: 'revenue', aggregation: 'sum' },
        { name: 'Active Users', column: 'user_id', aggregation: 'count_distinct' },
        { name: 'Data Processed', column: 'data_size', aggregation: 'sum' },
        { name: 'Avg Query Time', column: 'query_time', aggregation: 'avg' },
      ])

      if (kpisResponse.success && kpisResponse.data) {
        const transformedKpis = transformKPIs(kpisResponse.data)
        setKpis(transformedKpis)
      }

      // Fetch revenue time series
      const revenueResponse = await apiClient.analytics.generateTimeSeries(
        datasetId,
        'date',
        'revenue',
        'sum',
        'month'
      )

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data as ChartDataPoint[])
      }

      // Fetch activity time series
      const activityResponse = await apiClient.analytics.generateTimeSeries(
        datasetId,
        'timestamp',
        'queries',
        'count',
        'hour'
      )

      if (activityResponse.success && activityResponse.data) {
        setActivityData(activityResponse.data as ChartDataPoint[])
      }

      setLoading(false)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
      setLoading(false)
    }
  }

  const transformKPIs = (data: any): KPI[] => {
    const iconMap: { [key: string]: any } = {
      'Total Revenue': DollarSign,
      'Active Users': Users,
      'Data Processed': Database,
      'Avg Query Time': Activity,
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.map((kpi: any) => ({
      name: kpi.name || 'Unknown',
      value: formatKPIValue(kpi.name, kpi.value),
      change: kpi.change || '+0%',
      trend: (kpi.trend || 'up') as 'up' | 'down',
      icon: iconMap[kpi.name] || Activity,
    }))
  }

  const formatKPIValue = (name: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A'

    const numValue = parseFloat(value)
    if (isNaN(numValue)) return String(value)

    if (name === 'Total Revenue') {
      return `$${(numValue / 1000000).toFixed(1)}M`
    } else if (name === 'Active Users') {
      return numValue.toLocaleString()
    } else if (name === 'Data Processed') {
      return `${(numValue / 1099511627776).toFixed(1)}TB`
    } else if (name === 'Avg Query Time') {
      return `${numValue.toFixed(0)}ms`
    }

    return numValue.toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-synora-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} glass>
              <div className="animate-pulse">
                <div className="h-10 w-10 bg-synora-gray-300 rounded-lg mb-3" />
                <div className="h-8 bg-synora-gray-300 rounded mb-2" />
                <div className="h-4 bg-synora-gray-300 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} glass padding="lg">
              <div className="animate-pulse">
                <div className="h-6 bg-synora-gray-300 rounded w-1/3 mb-4" />
                <div className="h-60 bg-synora-gray-300 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-synora-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>

        <Card glass padding="lg">
          <div className="flex items-center gap-3 text-synora-gray-600">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">{error}</p>
              <button
                onClick={() => loadDashboardData()}
                className="text-sm text-synora-black hover:underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <Card glass className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Demo Mode Active</h3>
              <p className="text-sm text-blue-700">
                Exploring 100,000 enterprise sales records (2025-2026). Sign up to analyze your own data.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-synora-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card glass hover>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-synora-black rounded-lg flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-0.5">{kpi.value}</div>
              <div className="text-xs text-synora-gray-600">{kpi.name}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card glass padding="lg">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#000000" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-synora-gray-500">
              No data available
            </div>
          )}
        </Card>

        <Card glass padding="lg">
          <h3 className="text-lg font-semibold mb-4">Query Activity (24h)</h3>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="time" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip />
                <Bar dataKey="queries" fill="#000000" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-synora-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-synora-gray-600">Loading...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} glass>
              <div className="animate-pulse">
                <div className="h-10 w-10 bg-synora-gray-300 rounded-lg mb-3" />
                <div className="h-8 bg-synora-gray-300 rounded mb-2" />
                <div className="h-4 bg-synora-gray-300 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
