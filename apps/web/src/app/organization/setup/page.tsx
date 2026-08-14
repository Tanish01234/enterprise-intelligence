'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Building2, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function OrganizationSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    orgName: '',
    industry: '',
    teamSize: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call to create organization
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Organization created successfully!')
      router.push('/workspace/setup')
    } catch (error) {
      toast.error('Failed to create organization')
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
            <h1 className="heading-3 mb-2">Set up your organization</h1>
            <p className="body-regular">Let&apos;s get your team workspace ready</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-synora-black text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="text-sm font-medium">Organization</span>
            </div>
            <div className="w-16 h-0.5 bg-synora-gray-300 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-synora-gray-300 text-synora-gray-600 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm text-synora-gray-600">Workspace</span>
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
                label="Organization Name"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                placeholder="Acme Inc."
                leftIcon={<Building2 className="w-5 h-5" />}
                required
                glass
              />

              <div>
                <label className="block text-sm font-medium text-synora-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black transition-all"
                  required
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance & Banking</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail & E-commerce</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-synora-gray-700 mb-2">
                  Team Size
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black transition-all"
                  required
                >
                  <option value="">Select team size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
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
                  Continue
                </Button>
              </div>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-synora-gray-600">
            You can change these settings later in your organization dashboard
          </p>
        </motion.div>
      </div>
    </div>
  )
}
