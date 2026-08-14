'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Folder, Sparkles, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function WorkspaceSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    workspaceName: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call to create workspace
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Workspace created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-8 h-8" />
              <span className="text-3xl font-bold">Synora</span>
            </div>
            <h1 className="heading-3 mb-2">Create your workspace</h1>
            <p className="body-regular">Organize your projects and data in dedicated workspaces</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-synora-gray-600">Organization</span>
            </div>
            <div className="w-16 h-0.5 bg-synora-black mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-synora-black text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm font-medium">Workspace</span>
            </div>
            <div className="w-16 h-0.5 bg-synora-gray-300 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-synora-gray-300 text-synora-gray-600 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm text-synora-gray-600">Complete</span>
            </div>
          </div>

          <Card glass>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="text"
                label="Workspace Name"
                value={formData.workspaceName}
                onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                placeholder="Marketing Analytics"
                leftIcon={<Folder className="w-5 h-5" />}
                required
                glass
              />

              <div>
                <label className="block text-sm font-medium text-synora-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will you use this workspace for?"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black transition-all resize-none"
                />
              </div>

              {/* Quick Setup Options */}
              <div>
                <label className="block text-sm font-medium text-synora-gray-700 mb-3">
                  Quick Setup (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="p-4 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg hover:bg-white/70 transition-all text-left"
                  >
                    <div className="font-medium mb-1">Sales Analytics</div>
                    <div className="text-xs text-synora-gray-600">
                      Pre-configured for sales data
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg hover:bg-white/70 transition-all text-left"
                  >
                    <div className="font-medium mb-1">Marketing</div>
                    <div className="text-xs text-synora-gray-600">
                      Campaign tracking & ROI
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg hover:bg-white/70 transition-all text-left"
                  >
                    <div className="font-medium mb-1">Product Analytics</div>
                    <div className="text-xs text-synora-gray-600">
                      User behavior & metrics
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg hover:bg-white/70 transition-all text-left"
                  >
                    <div className="font-medium mb-1">Financial</div>
                    <div className="text-xs text-synora-gray-600">
                      Revenue & expense tracking
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Skip for now
                </Button>
                <Button type="submit" fullWidth loading={loading}>
                  Create Workspace
                </Button>
              </div>
            </form>
          </Card>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900 mb-1">Invite team members later</div>
                <div className="text-sm text-blue-700">
                  You can invite colleagues to collaborate in your workspace from the settings page
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
