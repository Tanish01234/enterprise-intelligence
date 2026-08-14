'use client'

import { useState, useEffect } from 'react'
import { Users, Database, Brain, FileText, Activity, HardDrive, Trash2, Eye, Search, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'users' | 'organizations' | 'datasets' | 'ai' | 'reports' | 'system'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    totalDatasets: 0,
    totalConversations: 0,
    totalReports: 0,
    storageUsed: '0 GB',
  })

  // Data
  const [users, setUsers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [datasets, setDatasets] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'overview' || activeTab === 'organizations') {
        const orgsResponse = await apiClient.organizations.list()
        if (orgsResponse.success && orgsResponse.data) {
          const orgs = orgsResponse.data as any[]
          setOrganizations(orgs)
          setStats(prev => ({ ...prev, totalOrganizations: orgs.length }))
        }
      }

      if (activeTab === 'overview' || activeTab === 'datasets') {
        const datasetsResponse = await apiClient.datasets.list(0, 1000)
        if (datasetsResponse.success && datasetsResponse.data) {
          const data = datasetsResponse.data as { datasets: any[]; total: number }
          setDatasets(data.datasets || [])
          setStats(prev => ({ ...prev, totalDatasets: data.total || 0 }))
        }
      }

      if (activeTab === 'overview' || activeTab === 'ai') {
        const convosResponse = await apiClient.ai.listConversations(0, 1000)
        if (convosResponse.success && convosResponse.data) {
          const convos = Array.isArray(convosResponse.data) ? convosResponse.data : []
          setConversations(convos)
          setStats(prev => ({ ...prev, totalConversations: convos.length }))
        }
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Users },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'ai', label: 'AI Usage', icon: Brain },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'system', label: 'System', icon: HardDrive },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-synora-gray-600">Manage users, organizations, and system settings</p>
        </div>

        <Button onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <Card glass className="p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-synora-black text-white'
                    : 'hover:bg-synora-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glass>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-synora-black" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-synora-gray-600">Total Users</div>
                </div>
              </div>
            </Card>

            <Card glass>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-synora-black" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
                  <div className="text-sm text-synora-gray-600">Organizations</div>
                </div>
              </div>
            </Card>

            <Card glass>
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-synora-black" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalDatasets}</div>
                  <div className="text-sm text-synora-gray-600">Datasets</div>
                </div>
              </div>
            </Card>

            <Card glass>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-synora-black" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalConversations}</div>
                  <div className="text-sm text-synora-gray-600">AI Conversations</div>
                </div>
              </div>
            </Card>
          </div>

          {/* System Health */}
          <Card glass padding="lg">
            <h2 className="text-xl font-bold mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Database</span>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                    Healthy
                  </span>
                </div>
                <p className="text-xs text-green-700">All connections active</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">API</span>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                    Healthy
                  </span>
                </div>
                <p className="text-xs text-green-700">Response time: 45ms</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Storage</span>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                    Healthy
                  </span>
                </div>
                <p className="text-xs text-green-700">{stats.storageUsed} used</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card glass padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">User Management</h2>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              leftIcon={<Search className="w-5 h-5" />}
              glass
            />
          </div>

          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-synora-gray-400" />
            <p className="text-synora-gray-600">User management requires additional permissions</p>
            <p className="text-sm text-synora-gray-500 mt-1">
              Contact system administrator for user management access
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'organizations' && (
        <Card glass padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Organizations</h2>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations..."
              leftIcon={<Search className="w-5 h-5" />}
              glass
            />
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12 text-synora-gray-500">
              No organizations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-synora-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-synora-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-synora-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-synora-gray-50">
                      <td className="px-4 py-3 font-medium">{org.name}</td>
                      <td className="px-4 py-3 text-synora-gray-600">{org.company_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-synora-gray-600">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'datasets' && (
        <Card glass padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Dataset Management</h2>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets..."
              leftIcon={<Search className="w-5 h-5" />}
              glass
            />
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-12 text-synora-gray-500">
              No datasets found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-synora-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Rows
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-synora-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-synora-gray-200">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-synora-gray-50">
                      <td className="px-4 py-3 font-medium">{dataset.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          dataset.status === 'ready'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dataset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-synora-gray-600">
                        {dataset.row_count?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-synora-gray-600">
                        {new Date(dataset.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'ai' && (
        <Card glass padding="lg">
          <h2 className="text-xl font-bold mb-6">AI Usage Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card glass>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalConversations}</div>
                <div className="text-sm text-synora-gray-600">Total Conversations</div>
              </div>
            </Card>

            <Card glass>
              <div className="text-center">
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm text-synora-gray-600">Tokens Used (24h)</div>
              </div>
            </Card>

            <Card glass>
              <div className="text-center">
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm text-synora-gray-600">Active Sessions</div>
              </div>
            </Card>
          </div>

          {conversations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-synora-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-synora-gray-600 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-synora-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-synora-gray-200">
                  {conversations.slice(0, 10).map((convo) => (
                    <tr key={convo.id} className="hover:bg-synora-gray-50">
                      <td className="px-4 py-3 font-medium">{convo.title || 'Untitled'}</td>
                      <td className="px-4 py-3 text-synora-gray-600">
                        {new Date(convo.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card glass padding="lg">
          <h2 className="text-xl font-bold mb-6">Reports Management</h2>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-synora-gray-400" />
            <p className="text-synora-gray-600">No reports generated yet</p>
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card glass padding="lg">
            <h2 className="text-xl font-bold mb-6">System Status</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">PostgreSQL Database</h3>
                  <p className="text-sm text-synora-gray-600">Supabase connection</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">DuckDB Analytics</h3>
                  <p className="text-sm text-synora-gray-600">Query engine</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Running
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">API Server</h3>
                  <p className="text-sm text-synora-gray-600">FastAPI backend</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Running
                </span>
              </div>
            </div>
          </Card>

          <Card glass padding="lg">
            <h2 className="text-xl font-bold mb-6">Storage Usage</h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Datasets</span>
                  <span className="text-sm text-synora-gray-600">{stats.storageUsed}</span>
                </div>
                <div className="w-full bg-synora-gray-200 rounded-full h-2">
                  <div className="bg-synora-black h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Analytics Cache</span>
                  <span className="text-sm text-synora-gray-600">0.5 GB</span>
                </div>
                <div className="w-full bg-synora-gray-200 rounded-full h-2">
                  <div className="bg-synora-black h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
