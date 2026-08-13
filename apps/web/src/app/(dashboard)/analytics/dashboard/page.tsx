'use client'

import { useEffect, useState } from 'react'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import KpiCards, { KpiSummaryData } from '@/components/analytics/KpiCards'
import AnalyticsCharts, { TrendPoint, SegmentPoint, CategoryPoint } from '@/components/analytics/AnalyticsCharts'

export default function AnalyticsDashboardPage() {
  const { currentOrganization } = useOrg()
  const [kpis, setKpis] = useState<KpiSummaryData | undefined>(undefined)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [segments, setSegments] = useState<SegmentPoint[]>([])
  const [categories, setCategories] = useState<CategoryPoint[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    const headers: Record<string, string> = {}
    if (currentOrganization?.id) {
      headers['X-Organization-ID'] = currentOrganization.id
    }

    try {
      const [kpiRes, trendRes, segRes, catRes] = await Promise.all([
        fetch('/api/v1/analytics/kpis', { headers }).catch(() => null),
        fetch('/api/v1/analytics/trends', { headers }).catch(() => null),
        fetch('/api/v1/analytics/segments', { headers }).catch(() => null),
        fetch('/api/v1/analytics/categories', { headers }).catch(() => null),
      ])

      if (kpiRes && kpiRes.ok) {
        setKpis(await kpiRes.json())
      }
      if (trendRes && trendRes.ok) {
        const data = await trendRes.json()
        setTrends(data.points || [])
      }
      if (segRes && segRes.ok) {
        const data = await segRes.json()
        setSegments(data.segments || [])
      }
      if (catRes && catRes.ok) {
        const data = await catRes.json()
        setCategories(data.categories || [])
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [currentOrganization?.id])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive KPI Dashboard</h1>
          <p className="mt-1 text-white/50 text-sm">
            Real-time business performance analytics for{' '}
            <span className="text-purple-400 font-medium">{currentOrganization?.name || 'your organization'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analytics/upload"
            className="px-4 py-2 rounded-xl gradient-accent text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all"
          >
            + Upload Data
          </Link>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <KpiCards data={kpis} isLoading={isLoading} />

      {/* Analytics ECharts Components */}
      <AnalyticsCharts
        trendData={trends}
        segmentData={segments}
        categoryData={categories}
        isLoading={isLoading}
      />
    </div>
  )
}
