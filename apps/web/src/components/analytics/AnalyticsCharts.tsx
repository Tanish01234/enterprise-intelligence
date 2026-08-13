'use client'

import React from 'react'
import ReactECharts from 'echarts-for-react'

export interface TrendPoint {
  date: string
  revenue: number
  orders: number
  average_order_value: number
}

export interface SegmentPoint {
  segment: string
  customer_count: number
  total_spent: number
}

export interface CategoryPoint {
  category_name: string
  product_count: number
  total_sales: number
}

interface AnalyticsChartsProps {
  trendData?: TrendPoint[]
  segmentData?: SegmentPoint[]
  categoryData?: CategoryPoint[]
  isLoading?: boolean
}

export default function AnalyticsCharts({
  trendData = [],
  segmentData = [],
  categoryData = [],
  isLoading = false,
}: AnalyticsChartsProps) {
  // Time-Series Line/Area Chart Config
  const timeSeriesOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#ffffff', fontSize: 12 },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map((d) => d.date),
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11, formatter: '${value}' },
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map((d) => d.revenue),
        itemStyle: { color: '#a855f7' },
        lineStyle: { width: 3, color: '#a855f7' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 85, 247, 0.35)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0.0)' },
            ],
          },
        },
      },
    ],
  }

  // Segment Pie/Donut Chart Config
  const segmentPieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: '{b}: ${c} ({d}%)',
    },
    legend: {
      bottom: '0',
      textStyle: { color: '#a1a1aa', fontSize: 11 },
    },
    series: [
      {
        name: 'Segment Revenue',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#09090b',
          borderWidth: 2,
        },
        label: { show: false },
        data: segmentData.map((s, idx) => ({
          value: s.total_spent,
          name: s.segment.toUpperCase(),
          itemStyle: {
            color: ['#a855f7', '#6366f1', '#3b82f6', '#10b981'][idx % 4],
          },
        })),
      },
    ],
  }

  // Category Bar Chart Config
  const categoryBarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#ffffff', fontSize: 12 },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categoryData.map((c) => c.category_name),
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11, formatter: '${value}' },
    },
    series: [
      {
        name: 'Total Sales',
        type: 'bar',
        barWidth: '40%',
        data: categoryData.map((c) => c.total_sales),
        itemStyle: {
          color: '#6366f1',
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 h-80 animate-pulse" />
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 h-80 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Time Series Chart */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Revenue Trend</h3>
            <p className="text-xs text-white/40">Daily aggregate sales performance</p>
          </div>
        </div>
        {trendData.length > 0 ? (
          <ReactECharts option={timeSeriesOption} style={{ height: '300px', width: '100%' }} />
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-white/40">
            No time-series data available. Upload a dataset to visualize trends.
          </div>
        )}
      </div>

      {/* Segment Pie & Category Bar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h3 className="text-sm font-bold text-white mb-1">Customer Segment Breakdown</h3>
          <p className="text-xs text-white/40 mb-4">Revenue distribution across VIP, Regular, and New segments</p>
          {segmentData.length > 0 ? (
            <ReactECharts option={segmentPieOption} style={{ height: '260px', width: '100%' }} />
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-white/40">
              No segment data available.
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h3 className="text-sm font-bold text-white mb-1">Category Sales Performance</h3>
          <p className="text-xs text-white/40 mb-4">Product revenue by category classification</p>
          {categoryData.length > 0 ? (
            <ReactECharts option={categoryBarOption} style={{ height: '260px', width: '100%' }} />
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-white/40">
              No category performance data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
