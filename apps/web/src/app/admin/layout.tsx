'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // Get current user profile
      const response = await apiClient.profiles.getMe()
      
      if (!response.success || !response.data) {
        throw new Error('Failed to load profile')
      }

      // Get user's organization role
      const orgsResponse = await apiClient.organizations.list()
      
      if (orgsResponse.success && orgsResponse.data) {
        const orgs = orgsResponse.data as any[]
        
        if (orgs.length > 0) {
          const membersResponse = await apiClient.organizations.listMembers(orgs[0].id)
          
          if (membersResponse.success && membersResponse.data) {
            const members = membersResponse.data as any[]
            const currentUserMember = members.find((m: any) => m.user_id === response.data.user_id)
            
            // Check if user is owner or admin
            if (currentUserMember && (currentUserMember.role === 'owner' || currentUserMember.role === 'admin')) {
              setIsAdmin(true)
              setLoading(false)
              return
            }
          }
        }
      }

      // Not an admin - redirect
      toast.error('Access denied. Admin privileges required.')
      router.push('/app/dashboard')
    } catch (error) {
      console.error('Admin access check failed:', error)
      toast.error('Failed to verify admin access')
      router.push('/app/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-synora-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-synora-black mx-auto mb-4" />
          <p className="text-synora-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-synora-gray-50 to-white">
      {/* Admin Header */}
      <div className="bg-synora-black text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">Admin Panel</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  )
}
