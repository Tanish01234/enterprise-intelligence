'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { apiClient } = await import('@/lib/api-client')
      const response = await apiClient.auth.signIn(
        formData.email,
        formData.password
      )

      if (response.success && response.data) {
        const data = response.data as { 
          user: any
          session: { access_token: string; refresh_token?: string }
          is_demo?: boolean
        }
        
        const isDemo = data.is_demo || data.user?.user_metadata?.is_demo || false
        
        // Set token in client
        apiClient.setToken(data.session.access_token)
        
        // Set cookie for middleware (7 days expiry)
        const maxAge = formData.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24
        document.cookie = `auth_token=${data.session.access_token}; path=/; max-age=${maxAge}`
        
        // Store refresh token if provided
        if (data.session.refresh_token) {
          localStorage.setItem('refresh_token', data.session.refresh_token)
        }
        
        // Store demo mode flag
        if (isDemo) {
          localStorage.setItem('is_demo_mode', 'true')
          localStorage.setItem('demo_user_email', formData.email)
          toast.success('Welcome to Synora Demo!')
          router.push('/app/dashboard')
          return
        } else {
          localStorage.removeItem('is_demo_mode')
          localStorage.removeItem('demo_user_email')
        }
        
        // Check onboarding status
        const onboardingResponse = await apiClient.profiles.onboardingStatus()
        const onboardingComplete = (onboardingResponse.data as any)?.onboarding_completed || false
        
        toast.success('Welcome back!')
        
        // Redirect based on onboarding status
        if (onboardingComplete) {
          router.push('/app/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        toast.error(response.error || 'Invalid email or password')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error instanceof Error ? error.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    toast.error('Google OAuth requires configuration. Use email/password for now.')
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-synora-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">Synora</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-synora-gray-600">New to Synora?</span>
            <Link href="/auth/signup">
              <Button variant="secondary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-synora-gray-600">Sign in to your workspace</p>
          </div>

          {/* Demo Credentials Banner for Judges */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Demo Mode Available</h3>
              </div>
              <p className="text-sm text-blue-800 mb-3">
                Try Synora with 100K sales records without signing up
              </p>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Email:</p>
                    <p className="text-sm font-mono text-blue-900 select-all">demo@synora.ai</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Password:</p>
                    <p className="text-sm font-mono text-blue-900 select-all">Synora@2026</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card glass className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@company.com"
                leftIcon={<Mail className="w-5 h-5" />}
                required
                glass
                autoComplete="email"
              />

              <div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="hover:text-synora-black transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                  glass
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remember}
                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                    className="w-4 h-4 rounded border-synora-gray-300 text-synora-black focus:ring-synora-black"
                  />
                  <span className="text-sm text-synora-gray-700">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-synora-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth loading={loading} size="lg">
                Sign In
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-synora-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-synora-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-synora-gray-300 rounded-lg hover:bg-synora-gray-50 transition-all font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-synora-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-synora-black hover:underline">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
