'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, PieChart, TrendingUp, Table, Download, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const analyticsData = {
  revenue: [
    { category: 'Product A', value: 45000 },
    { category: 'Product B', value: 38000 },
    { category: 'Product C', value: 29000 },
    { category: 'Product D', value: 22000 },
    { category: 'Product E', value: 18000 },
  ],
  growth: [
    { month: 'Jan', value: 12 },
    { month: 'Feb', value: 19 },
    { month: 'Mar', value: 15 },
    { month: 'Apr', value: 25 },
    { month: 'May', value: 22 },
    { month: 'Jun', value: 30 },
  ],
  distribution: [
    { name: 'Direct', value: 35 },
    { name: 'Referral', value: 28 },
    { name: 'Social', value: 22 },
    { name: 'Email', value: 15 },
  ],
}

const COLORS = ['#000000', '#404040', '#737373', '#A3A3A3']

export default function AnalyticsPage() {
  const [activeChart, setActiveChart] = useState<'revenue' | 'growth' | 'distribution'>('revenue')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-3 mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics
          </h1>
          <p className="body-regular">Deep dive into your data with advanced analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
          <Button variant="secondary">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveChart('revenue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeChart === 'revenue'
              ? 'bg-synora-black text-white'
              : 'bg-synora-gray-100 hover:bg-synora-gray-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Revenue by Product</span>
        </button>
        <button
          onClick={() => setActiveChart('growth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeChart === 'growth'
              ? 'bg-synora-black text-white'
              : 'bg-synora-gray-100 hover:bg-synora-gray-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Growth Trend</span>
        </button>
        <button
          onClick={() => setActiveChart('distribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeChart === 'distribution'
              ? 'bg-synora-black text-white'
              : 'bg-synora-gray-100 hover:bg-synora-gray-200'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>Distribution</span>
        </button>
      </div>

      {/* Main Chart */}
      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card glass padding="lg">
          {activeChart === 'revenue' && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="category" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#000000" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'growth' && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={{ fill: '#000000', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'distribution' && (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPieChart>
                <Pie
                  data={analyticsData.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card glass hover>
          <div className="text-sm text-synora-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold">$152K</div>
          <div className="text-sm text-green-600 mt-1">+23.5% from last month</div>
        </Card>
        <Card glass hover>
          <div className="text-sm text-synora-gray-600 mb-1">Avg Growth Rate</div>
          <div className="text-2xl font-bold">20.5%</div>
          <div className="text-sm text-green-600 mt-1">+5.2% improvement</div>
        </Card>
        <Card glass hover>
          <div className="text-sm text-synora-gray-600 mb-1">Top Channel</div>
          <div className="text-2xl font-bold">Direct</div>
          <div className="text-sm text-synora-gray-600 mt-1">35% of traffic</div>
        </Card>
        <Card glass hover>
          <div className="text-sm text-synora-gray-600 mb-1">Data Quality</div>
          <div className="text-2xl font-bold">98.5%</div>
          <div className="text-sm text-green-600 mt-1">Excellent</div>
        </Card>
      </div>
    </div>
  )
}
