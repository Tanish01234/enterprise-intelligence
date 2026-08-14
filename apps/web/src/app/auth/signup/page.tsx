'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Building, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    terms: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.terms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setLoading(true)

    try {
      const { apiClient } = await import('@/lib/api-client')
      const response = await apiClient.auth.signUp(
        formData.email,
        formData.password,
        formData.name
      )

      if (response.success && response.data) {
        const data = response.data as { 
          user: any
          session?: { access_token?: string; refresh_token?: string } 
        }
        
        // Set token in client
        if (data.session?.access_token) {
          apiClient.setToken(data.session.access_token)
          
          // Set cookie for middleware
          document.cookie = `auth_token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
          
          // Store refresh token
          if (data.session.refresh_token) {
            localStorage.setItem('refresh_token', data.session.refresh_token)
          }
        }
        
        toast.success('Account created successfully!')
        router.push('/onboarding/organization')
      } else {
        toast.error(response.error || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex flex-col">
      <nav className="border-b border-synora-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">Synora</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-synora-gray-600">Already have an account?</span>
            <Link href="/auth/signin">
              <Button variant="secondary" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-synora-gray-600">Start your enterprise intelligence journey</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-synora-gray-200 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="text"
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                leftIcon={<User className="w-5 h-5" />}
                required
                glass
              />

              <Input
                type="email"
                label="Work Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@company.com"
                leftIcon={<Mail className="w-5 h-5" />}
                required
                glass
              />

              <Input
                type="text"
                label="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
                leftIcon={<Building className="w-5 h-5" />}
                required
                glass
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
                glass
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded border-synora-gray-300"
                  required
                />
                <span className="text-sm text-synora-gray-600">
                  I agree to the Terms and Privacy Policy
                </span>
              </label>

              <Button type="submit" fullWidth loading={loading} size="lg">
                Create Account <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-synora-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-synora-black hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
