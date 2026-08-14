'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Database,
  Brain,
  BarChart3,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Download,
  Sparkles,
  LineChart,
  PieChart,
  Activity,
  DollarSign,
  Users,
  ShoppingCart,
  Heart,
  Building2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
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

// Demo datasets
const DEMO_DATASETS = {
  retail: {
    name: 'Retail Sales Analytics',
    icon: ShoppingCart,
    description: 'E-commerce sales data with customer segments and product categories',
    color: '#3B82F6',
    data: [
      { month: 'Jan', revenue: 125000, customers: 450, orders: 892 },
      { month: 'Feb', revenue: 142000, customers: 520, orders: 1024 },
      { month: 'Mar', revenue: 168000, customers: 610, orders: 1205 },
      { month: 'Apr', revenue: 195000, customers: 720, orders: 1450 },
      { month: 'May', revenue: 218000, customers: 820, orders: 1680 },
      { month: 'Jun', revenue: 245000, customers: 950, orders: 1920 },
    ],
    categories: [
      { name: 'Electronics', value: 35, amount: 85750 },
      { name: 'Fashion', value: 28, amount: 68600 },
      { name: 'Home & Garden', value: 22, amount: 53900 },
      { name: 'Sports', value: 15, amount: 36750 },
    ],
  },
  healthcare: {
    name: 'Healthcare Analytics',
    icon: Heart,
    description: 'Patient outcomes, treatment efficacy, and resource utilization',
    color: '#EF4444',
    data: [
      { month: 'Jan', patients: 1240, satisfaction: 4.2, efficiency: 78 },
      { month: 'Feb', patients: 1320, satisfaction: 4.3, efficiency: 81 },
      { month: 'Mar', patients: 1480, satisfaction: 4.4, efficiency: 83 },
      { month: 'Apr', patients: 1560, satisfaction: 4.5, efficiency: 85 },
      { month: 'May', patients: 1680, satisfaction: 4.6, efficiency: 87 },
      { month: 'Jun', patients: 1820, satisfaction: 4.7, efficiency: 89 },
    ],
    categories: [
      { name: 'Cardiology', value: 30, amount: 546 },
      { name: 'Orthopedics', value: 25, amount: 455 },
      { name: 'Neurology', value: 20, amount: 364 },
      { name: 'General', value: 25, amount: 455 },
    ],
  },
  finance: {
    name: 'Financial Services',
    icon: Building2,
    description: 'Transaction analytics, risk assessment, and portfolio performance',
    color: '#10B981',
    data: [
      { month: 'Jan', transactions: 45200, volume: 12.4, risk: 2.1 },
      { month: 'Feb', transactions: 48600, volume: 14.2, risk: 1.9 },
      { month: 'Mar', transactions: 52400, volume: 16.8, risk: 1.7 },
      { month: 'Apr', transactions: 58900, volume: 19.5, risk: 1.5 },
      { month: 'May', transactions: 64200, volume: 21.8, risk: 1.4 },
      { month: 'Jun', transactions: 71500, volume: 24.5, risk: 1.2 },
    ],
    categories: [
      { name: 'Investments', value: 42, amount: 10.29 },
      { name: 'Loans', value: 28, amount: 6.86 },
      { name: 'Deposits', value: 20, amount: 4.9 },
      { name: 'Insurance', value: 10, amount: 2.45 },
    ],
  },
}

const DEMO_STEPS = [
  { id: 1, title: 'Load Dataset', icon: Database, description: 'Importing sample data' },
  { id: 2, title: 'AI Analysis', icon: Brain, description: 'Processing with Gemini AI' },
  { id: 3, title: 'Generate Charts', icon: BarChart3, description: 'Creating visualizations' },
  { id: 4, title: 'Extract Insights', icon: Zap, description: 'Identifying patterns' },
]

const COLORS = ['#000000', '#404040', '#737373', '#A3A3A3']

export default function DemoPage() {
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof DEMO_DATASETS | null>(null)
  const [demoRunning, setDemoRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  const startDemo = (dataset: keyof typeof DEMO_DATASETS) => {
    setSelectedDataset(dataset)
    setDemoRunning(true)
    setCurrentStep(0)
    setCompletedSteps([])
    setAiInsights([])
    setShowResults(false)
    runDemoSequence()
  }

  const runDemoSequence = async () => {
    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCompletedSteps(prev => [...prev, i])
      
      if (i === 1) {
        // Generate AI insights
        setTimeout(() => setAiInsights(prev => [...prev, '📈 Revenue increased 96% over 6 months']), 300)
        setTimeout(() => setAiInsights(prev => [...prev, '👥 Customer acquisition rate: +111%']), 600)
        setTimeout(() => setAiInsights(prev => [...prev, '🎯 Top performing category drives 35% of sales']), 900)
        setTimeout(() => setAiInsights(prev => [...prev, '💡 Recommend: Focus on Q2 strategies for Q3']), 1200)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setShowResults(true)
    setDemoRunning(false)
  }

  const resetDemo = () => {
    setSelectedDataset(null)
    setDemoRunning(false)
    setCurrentStep(0)
    setCompletedSteps([])
    setAiInsights([])
    setShowResults(false)
  }

  const selectedData = selectedDataset ? DEMO_DATASETS[selectedDataset] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-synora-gray-50 via-white to-synora-gray-100">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-synora-gray-100 via-transparent to-transparent"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-synora-black text-synora-white rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Experience Synora
            <br />
            <span className="bg-gradient-to-r from-synora-black to-synora-gray-600 bg-clip-text text-transparent">
              In Action
            </span>
          </h1>
          
          <p className="text-xl text-synora-gray-600 max-w-3xl mx-auto mb-12">
            Witness the power of AI-driven analytics in real-time. No setup required.
            <br />
            Choose a dataset and watch Synora transform data into insights.
          </p>
        </motion.div>
      </section>

      {/* Dataset Selection */}
      {!selectedDataset && !demoRunning && (
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Demo Dataset</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(DEMO_DATASETS).map(([key, dataset], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    glass
                    hover
                    className="h-full cursor-pointer group"
                    onClick={() => startDemo(key as keyof typeof DEMO_DATASETS)}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${dataset.color}20` }}
                    >
                      <dataset.icon className="w-8 h-8" style={{ color: dataset.color }} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{dataset.name}</h3>
                    <p className="text-sm text-synora-gray-600 mb-4">{dataset.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                      <span>Start Demo</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo Progress */}
      {(demoRunning || showResults) && selectedData && (
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Progress Steps */}
            <Card glass padding="lg">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Demo Progress</h2>
                <Button variant="secondary" size="sm" onClick={resetDemo}>
                  Reset Demo
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DEMO_STEPS.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      completedSteps.includes(index)
                        ? 'border-green-500 bg-green-50'
                        : currentStep === index
                        ? 'border-synora-black bg-synora-gray-50 animate-pulse'
                        : 'border-synora-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {completedSteps.includes(index) ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <step.icon className={`w-5 h-5 ${currentStep === index ? 'animate-pulse' : ''}`} />
                      )}
                      <span className="font-semibold text-sm">{step.title}</span>
                    </div>
                    <p className="text-xs text-synora-gray-600">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* AI Insights Panel */}
            <AnimatePresence>
              {aiInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card glass padding="lg" className="bg-gradient-to-br from-synora-black to-synora-gray-800 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-6 h-6" />
                      <h3 className="text-xl font-bold">AI Insights</h3>
                      <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full">
                        Powered by Gemini
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {aiInsights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                        >
                          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Dashboard */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card glass hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-600">+96%</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {selectedDataset === 'retail' && '$245K'}
                      {selectedDataset === 'healthcare' && '1,820'}
                      {selectedDataset === 'finance' && '71.5K'}
                    </div>
                    <div className="text-sm text-synora-gray-600">
                      {selectedDataset === 'retail' && 'Total Revenue'}
                      {selectedDataset === 'healthcare' && 'Patients Served'}
                      {selectedDataset === 'finance' && 'Transactions'}
                    </div>
                  </Card>

                  <Card glass hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-600">+111%</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {selectedDataset === 'retail' && '950'}
                      {selectedDataset === 'healthcare' && '4.7'}
                      {selectedDataset === 'finance' && '$24.5M'}
                    </div>
                    <div className="text-sm text-synora-gray-600">
                      {selectedDataset === 'retail' && 'Active Customers'}
                      {selectedDataset === 'healthcare' && 'Satisfaction Score'}
                      {selectedDataset === 'finance' && 'Transaction Volume'}
                    </div>
                  </Card>

                  <Card glass hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-600">+115%</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {selectedDataset === 'retail' && '1,920'}
                      {selectedDataset === 'healthcare' && '89%'}
                      {selectedDataset === 'finance' && '1.2%'}
                    </div>
                    <div className="text-sm text-synora-gray-600">
                      {selectedDataset === 'retail' && 'Total Orders'}
                      {selectedDataset === 'healthcare' && 'Efficiency Score'}
                      {selectedDataset === 'finance' && 'Risk Score'}
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Trend Chart */}
                  <Card glass padding="lg">
                    <h3 className="text-xl font-semibold mb-6">Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={selectedData.data}>
                        <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey={Object.keys(selectedData.data[0])[1]}
                          stroke="#000000"
                          fillOpacity={1}
                          fill="url(#colorTrend)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Category Distribution */}
                  <Card glass padding="lg">
                    <h3 className="text-xl font-semibold mb-6">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={selectedData.categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {selectedData.categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* CTA */}
                <Card glass className="bg-gradient-to-r from-synora-black to-synora-gray-800 text-white text-center">
                  <div className="py-8">
                    <h3 className="text-2xl font-bold mb-3">Ready to analyze your data?</h3>
                    <p className="text-synora-gray-300 mb-6 max-w-2xl mx-auto">
                      This demo shows just a fraction of Synora&apos;s capabilities. Sign up to unlock the full platform.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Button size="lg" variant="secondary" className="bg-white text-synora-black border-white hover:bg-synora-gray-100">
                        Start Free Trial
                      </Button>
                      <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
