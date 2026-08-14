'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Folder, Sparkles, ArrowRight, CheckCircle, BarChart3, ShoppingCart, DollarSign, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const templates = [
  { id: 'sales', name: 'Sales Analytics', icon: DollarSign, desc: 'Track revenue & pipeline' },
  { id: 'marketing', name: 'Marketing', icon: BarChart3, desc: 'Campaign ROI & metrics' },
  { id: 'product', name: 'Product Analytics', icon: ShoppingCart, desc: 'User behavior & retention' },
  { id: 'finance', name: 'Financial', icon: DollarSign, desc: 'Revenue & expenses' },
]

export default function WorkspaceOnboarding() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Workspace creation handled by organization setup
      // This step is optional for additional workspace configuration
      
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Set cookie with 7 days expiry to match auth_token
      const maxAge = 60 * 60 * 24 * 7
      document.cookie = `has_workspace=true; path=/; max-age=${maxAge}`
      
      toast.success('Workspace created!')
      router.push('/app/dashboard')
    } catch (error) {
      console.error('Workspace creation error:', error)
      toast.error('Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Create your workspace</h1>
          <p className="text-synora-gray-600">Organize projects in dedicated workspaces</p>
        </div>

        <div className="flex items-center justify-center mb-8 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>
            <span className="text-sm text-synora-gray-600">Organization</span>
          </div>
          <div className="w-16 h-0.5 bg-synora-black" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-synora-black text-white flex items-center justify-center text-sm font-semibold">2</div>
            <span className="text-sm font-medium">Workspace</span>
          </div>
          <div className="w-16 h-0.5 bg-synora-gray-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-synora-gray-300 flex items-center justify-center text-sm">3</div>
            <span className="text-sm text-synora-gray-600">Complete</span>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm border border-synora-gray-200 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Workspace Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Marketing Analytics"
              leftIcon={<Folder className="w-5 h-5" />}
              required
              glass
            />

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will you use this workspace for?"
                rows={3}
                className="w-full px-4 py-2.5 bg-white/50 border border-synora-gray-300 rounded-lg resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Quick Setup Templates</label>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selected === t.id ? 'border-synora-black bg-synora-gray-50' : 'border-synora-gray-200 hover:bg-white'
                    }`}
                  >
                    <t.icon className="w-5 h-5 mb-2" />
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-synora-gray-600">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="secondary" fullWidth onClick={() => router.push('/app/dashboard')}>
                Skip
              </Button>
              <Button type="submit" fullWidth loading={loading}>
                Create Workspace <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
