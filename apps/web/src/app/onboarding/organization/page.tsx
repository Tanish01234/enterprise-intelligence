'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Building2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function OrganizationOnboarding() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Organization creation handled by onboarding completion
      // This page is for additional org setup if needed
      
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Set cookie with 7 days expiry to match auth_token
      const maxAge = 60 * 60 * 24 * 7
      document.cookie = `has_organization=true; path=/; max-age=${maxAge}`
      
      toast.success('Organization created!')
      router.push('/onboarding/workspace')
    } catch (error) {
      console.error('Organization creation error:', error)
      toast.error('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Set up your organization</h1>
          <p className="text-synora-gray-600">Let&apos;s get your team workspace ready</p>
        </div>

        <div className="flex items-center justify-center mb-8 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-synora-black text-white flex items-center justify-center text-sm font-semibold">1</div>
            <span className="text-sm font-medium">Organization</span>
          </div>
          <div className="w-16 h-0.5 bg-synora-gray-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-synora-gray-300 flex items-center justify-center text-sm">2</div>
            <span className="text-sm text-synora-gray-600">Workspace</span>
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
              label="Organization Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Corporation"
              leftIcon={<Building2 className="w-5 h-5" />}
              required
              glass
            />

            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/50 border border-synora-gray-300 rounded-lg"
                required
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Team Size</label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/50 border border-synora-gray-300 rounded-lg"
                required
              >
                <option value="">Select size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201+">201+</option>
              </select>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="secondary" fullWidth onClick={() => router.push('/app/dashboard')}>
                Skip
              </Button>
              <Button type="submit" fullWidth loading={loading}>
                Continue <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
