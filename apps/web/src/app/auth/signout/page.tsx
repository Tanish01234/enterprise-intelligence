'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, LogOut } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const signOut = async () => {
      try {
        // Call backend signout
        await apiClient.auth.signOut()
      } catch (error) {
        console.error('Signout error:', error)
      } finally {
        // Clear all auth data
        apiClient.setToken(null)
        localStorage.removeItem('refresh_token')
        
        // Clear cookies
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'has_organization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'has_workspace=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        
        // Redirect to landing page
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    }

    signOut()
  }, [router])

  return (
    <div className="min-h-screen bg-synora-gray-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-synora-black rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut className="w-8 h-8 text-synora-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Signing you out...</h1>
        <p className="text-synora-gray-600">Please wait while we securely log you out</p>
        
        <div className="mt-8 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm text-synora-gray-500">Synora</span>
        </div>
      </motion.div>
    </div>
  )
}
