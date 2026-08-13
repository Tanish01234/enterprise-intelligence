'use client'

import React from 'react'
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react'

export interface KpiSummaryData {
  total_revenue: number
  total_orders: number
  average_order_value: number
  total_customers: number
  gross_margin_pct: number
  currency?: string
}

interface KpiCardsProps {
  data?: KpiSummaryData
  isLoading?: boolean
}

export default function KpiCards({ data, isLoading = false }: KpiCardsProps) {
  const currencySymbol = data?.currency === 'USD' ? '$' : data?.currency || '$'

  const kpis = [
    {
      title: 'Total Revenue',
      value: data ? `${currencySymbol}${data.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      change: '+14.2% vs last month',
      isPositive: true,
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Total Orders & AOV',
      value: data ? `${data.total_orders.toLocaleString()} orders` : '0 orders',
      subtitle: data ? `AOV: ${currencySymbol}${data.average_order_value.toFixed(2)}` : 'AOV: $0.00',
      icon: ShoppingBag,
      color: 'indigo',
    },
    {
      title: 'Active Customers',
      value: data ? data.total_customers.toLocaleString() : '0',
      change: '+8.5% retention rate',
      isPositive: true,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Gross Margin',
      value: data ? `${data.gross_margin_pct.toFixed(1)}%` : '0.0%',
      change: 'Healthy profitability',
      isPositive: true,
      icon: TrendingUp,
      color: 'green',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 animate-pulse">
            <div className="h-4 w-24 bg-white/10 rounded mb-3" />
            <div className="h-8 w-32 bg-white/10 rounded mb-2" />
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon
        return (
          <div
            key={index}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
                {kpi.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
              {kpi.subtitle && (
                <p className="text-xs font-semibold text-purple-300">{kpi.subtitle}</p>
              )}
              {kpi.change && (
                <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <span>↑</span> {kpi.change}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
