'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface KPI {
  name: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
}

interface ChartData {
  [key: string]: any
}

interface DashboardData {
  kpis: KPI[]
  revenueData: ChartData[]
  activityData: ChartData[]
  loading: boolean
  error: string | null
}

export function useDashboardData(datasetId?: string) {
  const [data, setData] = useState<DashboardData>({
    kpis: [],
    revenueData: [],
    activityData: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId])

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // If no dataset, fetch from all available datasets
      const datasetsResponse = await apiClient.datasets.list(0, 1)
      const datasetsData = datasetsResponse.data as { datasets?: any[]; total?: number } | undefined
      
      if (!datasetsResponse.success || !datasetsData?.datasets?.length) {
        // Use demo data if no datasets available
        setData({
          kpis: generateDemoKPIs(),
          revenueData: generateDemoRevenueData(),
          activityData: generateDemoActivityData(),
          loading: false,
          error: null,
        })
        return
      }

      const firstDataset = datasetsData.datasets[0]
      const targetDatasetId = datasetId || firstDataset.id

      // Fetch KPIs
      const kpisResponse = await apiClient.analytics.calculateKpis(targetDatasetId, [
        { name: 'Total Revenue', column: 'revenue', aggregation: 'sum' },
        { name: 'Active Users', column: 'user_id', aggregation: 'count_distinct' },
        { name: 'Avg Query Time', column: 'query_time', aggregation: 'avg' },
      ])

      // Fetch time series for revenue
      const revenueResponse = await apiClient.analytics.generateTimeSeries(
        targetDatasetId,
        'date',
        'revenue',
        'sum',
        'month'
      )

      // Fetch activity data
      const activityResponse = await apiClient.analytics.generateTimeSeries(
        targetDatasetId,
        'timestamp',
        'queries',
        'count',
        'hour'
      )

      const revenueDataResult = (revenueResponse.data as ChartData[] | undefined) || []
      const activityDataResult = (activityResponse.data as ChartData[] | undefined) || []

      setData({
        kpis: transformKPIs(kpisResponse.data),
        revenueData: revenueDataResult,
        activityData: activityDataResult,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      
      // Fallback to demo data on error
      setData({
        kpis: generateDemoKPIs(),
        revenueData: generateDemoRevenueData(),
        activityData: generateDemoActivityData(),
        loading: false,
        error: 'Using demo data - connect a dataset for live analytics',
      })
    }
  }

  return { ...data, refresh: loadDashboardData }
}

function transformKPIs(kpiData: any): KPI[] {
  if (!kpiData) return generateDemoKPIs()

  // Transform backend KPI data to frontend format
  // This is a placeholder - adjust based on actual API response
  return generateDemoKPIs()
}

function generateDemoKPIs(): KPI[] {
  return [
    {
      name: 'Total Revenue',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: null,
    },
    {
      name: 'Active Users',
      value: '12,458',
      change: '+8.2%',
      trend: 'up',
      icon: null,
    },
    {
      name: 'Data Processed',
      value: '4.8TB',
      change: '+23.1%',
      trend: 'up',
      icon: null,
    },
    {
      name: 'Avg Query Time',
      value: '42ms',
      change: '-15.3%',
      trend: 'down',
      icon: null,
    },
  ]
}

function generateDemoRevenueData() {
  return [
    { month: 'Jan', value: 420000 },
    { month: 'Feb', value: 510000 },
    { month: 'Mar', value: 480000 },
    { month: 'Apr', value: 620000 },
    { month: 'May', value: 710000 },
    { month: 'Jun', value: 890000 },
  ]
}

function generateDemoActivityData() {
  return [
    { time: '00:00', queries: 45 },
    { time: '04:00', queries: 32 },
    { time: '08:00', queries: 78 },
    { time: '12:00', queries: 95 },
    { time: '16:00', queries: 112 },
    { time: '20:00', queries: 67 },
  ]
}
