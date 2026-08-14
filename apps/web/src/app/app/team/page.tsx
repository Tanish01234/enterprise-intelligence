'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, UserPlus, MoreVertical, Search, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [currentOrg, setCurrentOrg] = useState<any>(null)

  useEffect(() => {
    loadOrganization()
  }, [])

  useEffect(() => {
    if (currentOrg) {
      loadMembers()
    }
  }, [currentOrg])

  const loadOrganization = async () => {
    try {
      const response = await apiClient.organizations.list()
      if (response.success && response.data) {
        const orgs = response.data as any[]
        if (orgs.length > 0) {
          setCurrentOrg(orgs[0])
        }
      }
    } catch (error) {
      console.error('Failed to load organization:', error)
    }
  }

  const loadMembers = async () => {
    if (!currentOrg) return

    setLoading(true)
    try {
      const response = await apiClient.organizations.listMembers(currentOrg.id)
      if (response.success && response.data) {
        setMembers(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = () => {
    toast.error('Email invitations require email service configuration')
    setShowInviteModal(false)
  }

  const filteredMembers = members.filter((member) =>
    member.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      analyst: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role] || colors.viewer}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  if (!currentOrg) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team</h1>
          <p className="text-synora-gray-600">Manage team members</p>
        </div>

        <Card glass padding="lg">
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Organization</h3>
            <p className="text-synora-gray-600 mb-4">
              Create an organization to manage team members
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team</h1>
          <p className="text-synora-gray-600">Manage team members and permissions</p>
        </div>

        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Search and Filters */}
      <Card glass className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              leftIcon={<Search className="w-5 h-5" />}
              glass
            />
          </div>
        </div>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card glass>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-synora-black" />
            <div>
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-synora-gray-600">Total Members</div>
            </div>
          </div>
        </Card>

        <Card glass>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-synora-black" />
            <div>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'owner' || m.role === 'admin').length}
              </div>
              <div className="text-sm text-synora-gray-600">Admins</div>
            </div>
          </div>
        </Card>

        <Card glass>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-synora-black" />
            <div>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'analyst').length}
              </div>
              <div className="text-sm text-synora-gray-600">Analysts</div>
            </div>
          </div>
        </Card>

        <Card glass>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-synora-black" />
            <div>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'viewer').length}
              </div>
              <div className="text-sm text-synora-gray-600">Viewers</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Members List */}
      <Card glass>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-synora-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-synora-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-synora-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-synora-gray-500">
                    No team members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-synora-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-synora-black rounded-full flex items-center justify-center text-white font-medium">
                          {member.user_id?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{member.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-synora-gray-600">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-synora-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card glass className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="colleague@company.com"
                glass
              />

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select className="w-full px-4 py-2 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black">
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button fullWidth onClick={handleInvite}>
                  <Mail className="w-4 h-4" />
                  Send Invitation
                </Button>
                <Button fullWidth variant="secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
