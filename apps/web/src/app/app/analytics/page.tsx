'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Calendar, Filter, Download, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

const COLORS = ['#000000', '#737373', '#A3A3A3', '#D4D4D4']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [kpis, setKpis] = useState<any[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [regionData, setRegionData] = useState<any[]>([])
  const [industryData, setIndustryData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])

  useEffect(() => {
    // Check demo mode
    if (typeof window !== 'undefined') {
      const isDemo = localStorage.getItem('is_demo_mode') === 'true'
      setIsDemoMode(isDemo)
      
      if (isDemo) {
        loadDemoAnalytics()
        return
      }
    }
    
    loadDatasets()
  }, [])

  useEffect(() => {
    if (selectedDataset && !isDemoMode) {
      loadAnalytics()
    }
  }, [selectedDataset])

  const loadDemoAnalytics = async () => {
    setLoading(true)
    try {
      // Load demo regions
      const regionsResponse = await apiClient.demo.regions()
      if (regionsResponse.success && regionsResponse.data) {
        setRegionData(regionsResponse.data as any[])
      }

      // Load demo industries
      const industriesResponse = await apiClient.demo.industries()
      if (industriesResponse.success && industriesResponse.data) {
        setIndustryData(industriesResponse.data as any[])
      }

      // Load demo products
      const productsResponse = await apiClient.demo.products()
      if (productsResponse.success && productsResponse.data) {
        setProductData(productsResponse.data as any[])
      }

      // Load demo year comparison
      const yearComparisonResponse = await apiClient.demo.yearComparison()
      if (yearComparisonResponse.success && yearComparisonResponse.data) {
        setTimeSeriesData(yearComparisonResponse.data as any[])
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load demo analytics:', error)
      toast.error('Failed to load analytics')
      setLoading(false)
    }
  }

  const loadDatasets = async () => {
    try {
      const response = await apiClient.datasets.list(0, 100)
      if (response.success && response.data) {
        const data = response.data as { datasets: any[]; total: number }
        setDatasets(data.datasets || [])
        
        // Auto-select first dataset
        if (data.datasets && data.datasets.length > 0) {
          setSelectedDataset(data.datasets[0].id)
        } else {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Failed to load datasets:', error)
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!selectedDataset) return
    
    setLoading(true)
    try {
      // Load KPIs
      const kpisResponse = await apiClient.analytics.calculateKpis(selectedDataset, [
        { name: 'Total Records', column: '*', aggregation: 'count' },
        { name: 'Unique Values', column: 'id', aggregation: 'count_distinct' },
      ])

      if (kpisResponse.success && kpisResponse.data) {
        setKpis(Array.isArray(kpisResponse.data) ? kpisResponse.data : [])
      }

      // Load time series (if date column exists)
      const timeSeriesResponse = await apiClient.analytics.generateTimeSeries(
        selectedDataset,
        'date',
        'value',
        'sum',
        'day'
      )

      if (timeSeriesResponse.success && timeSeriesResponse.data) {
        setTimeSeriesData(Array.isArray(timeSeriesResponse.data) ? timeSeriesResponse.data : [])
      }

    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (isDemoMode) {
      loadDemoAnalytics()
    } else {
      loadAnalytics()
    }
    toast.success('Analytics refreshed')
  }

  if (datasets.length === 0 && !loading && !isDemoMode) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-synora-gray-600">Deep dive into your data</p>
        </div>

        <Card glass padding="lg">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-synora-gray-600 mb-4">
              Upload your first dataset to start viewing analytics
            </p>
            <Button onClick={() => window.location.href = '/app/datasets'}>
              Upload Dataset
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <Card glass className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Demo Analytics</h3>
              <p className="text-sm text-blue-700">
                Analyzing real sales data across regions, industries, and products from 2025-2026.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-synora-gray-600">Deep dive into your data</p>
        </div>

        <div className="flex items-center gap-3">
          {!isDemoMode && (
            <select
              value={selectedDataset || ''}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="px-4 py-2 bg-white border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black"
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          )}

          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} glass>
              <div className="animate-pulse">
                <div className="h-8 bg-synora-gray-300 rounded mb-2" />
                <div className="h-4 bg-synora-gray-300 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isDemoMode ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-3">
                      <BarChart3 className="w-8 h-8 text-synora-black" />
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-1">100,000</div>
                    <div className="text-sm text-synora-gray-600">Total Records</div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-3">
                      <BarChart3 className="w-8 h-8 text-synora-black" />
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{regionData.length}</div>
                    <div className="text-sm text-synora-gray-600">Regions</div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-3">
                      <BarChart3 className="w-8 h-8 text-synora-black" />
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{industryData.length}</div>
                    <div className="text-sm text-synora-gray-600">Industries</div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-3">
                      <BarChart3 className="w-8 h-8 text-synora-black" />
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{productData.length}</div>
                    <div className="text-sm text-synora-gray-600">Products</div>
                  </Card>
                </motion.div>
              </>
            ) : kpis.length > 0 ? (
              kpis.map((kpi, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-3">
                      <BarChart3 className="w-8 h-8 text-synora-black" />
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {kpi.value?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-synora-gray-600">{kpi.name}</div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <>
                <Card glass>
                  <div className="flex items-start justify-between mb-3">
                    <BarChart3 className="w-8 h-8 text-synora-black" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {datasets.find(d => d.id === selectedDataset)?.row_count?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-synora-gray-600">Total Records</div>
                </Card>

                <Card glass>
                  <div className="flex items-start justify-between mb-3">
                    <BarChart3 className="w-8 h-8 text-synora-black" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {datasets.find(d => d.id === selectedDataset)?.column_count || '0'}
                  </div>
                  <div className="text-sm text-synora-gray-600">Columns</div>
                </Card>

                <Card glass>
                  <div className="flex items-start justify-between mb-3">
                    <BarChart3 className="w-8 h-8 text-synora-black" />
                  </div>
                  <div className="text-2xl font-bold mb-1">Ready</div>
                  <div className="text-sm text-synora-gray-600">Status</div>
                </Card>

                <Card glass>
                  <div className="flex items-start justify-between mb-3">
                    <BarChart3 className="w-8 h-8 text-synora-black" />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {datasets.find(d => d.id === selectedDataset)?.file_type?.toUpperCase() || 'N/A'}
                  </div>
                  <div className="text-sm text-synora-gray-600">File Type</div>
                </Card>
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Regional Performance */}
            <Card glass padding="lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {isDemoMode ? 'Regional Performance' : 'Time Series Analysis'}
              </h3>
              {isDemoMode && regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="region" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip />
                    <Bar dataKey="total_sales" fill="#000000" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="date" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-synora-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-synora-gray-400" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Industry Performance */}
            <Card glass padding="lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {isDemoMode ? 'Industry Performance' : 'Data Distribution'}
              </h3>
              {isDemoMode && industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={industryData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="industry" stroke="#737373" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#737373" />
                    <Tooltip />
                    <Bar dataKey="total_sales" fill="#000000" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Valid', value: 85 },
                    { name: 'Missing', value: 10 },
                    { name: 'Duplicates', value: 5 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="name" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#000000" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Product Performance Chart */}
          <Card glass padding="lg">
            <h3 className="text-lg font-semibold mb-4">
              {isDemoMode ? 'Top Products by Revenue' : 'Detailed Metrics'}
            </h3>
            {isDemoMode && productData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="product_category" stroke="#737373" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#737373" />
                  <Tooltip />
                  <Bar dataKey="total_sales" fill="#000000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData.length > 0 ? timeSeriesData : [
                  { date: 'Jan', value: 400 },
                  { date: 'Feb', value: 300 },
                  { date: 'Mar', value: 600 },
                  { date: 'Apr', value: 800 },
                  { date: 'May', value: 500 },
                  { date: 'Jun', value: 700 },
                ]}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="date" stroke="#737373" />
                  <YAxis stroke="#737373" />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#000000" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
