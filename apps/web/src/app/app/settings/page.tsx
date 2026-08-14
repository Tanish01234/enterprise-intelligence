'use client'

import { useState, useEffect } from 'react'
import { User, Building2, Bell, CreditCard, Key, Camera, Save, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'workspace' | 'notifications' | 'billing' | 'api'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile data
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company_name: '',
    job_title: '',
    industry: '',
    company_size: '',
    avatar_url: '',
    timezone: '',
  })

  // Workspace data
  const [workspace, setWorkspace] = useState({
    name: '',
    description: '',
    company_name: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    dataset_upload: true,
    ai_query_complete: true,
    report_generated: true,
    team_invites: true,
    product_updates: false,
  })

  useEffect(() => {
    loadProfileData()
    loadWorkspaceData()
  }, [])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.profiles.getMe()
      if (response.success && response.data) {
        setProfile(response.data as any)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkspaceData = async () => {
    try {
      const response = await apiClient.organizations.list()
      if (response.success && response.data) {
        const orgs = response.data as any[]
        if (orgs.length > 0) {
          setWorkspace({
            name: orgs[0].name || '',
            description: orgs[0].description || '',
            company_name: orgs[0].company_name || '',
          })
        }
      }
    } catch (error) {
      console.error('Failed to load workspace:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await apiClient.profiles.updateMe(profile)
      if (response.success) {
        toast.success('Profile updated successfully')
      } else {
        throw new Error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = () => {
    toast.success('Notification settings saved')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Settings', icon: Key },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-synora-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card glass className="lg:col-span-1 p-2 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-synora-black text-white'
                      : 'hover:bg-synora-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {loading && activeTab === 'profile' ? (
            <Card glass padding="lg">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-synora-gray-400" />
              </div>
            </Card>
          ) : (
            <>
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <Card glass padding="lg">
                  <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-synora-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profile.full_name?.substring(0, 2).toUpperCase() || 'US'}
                      </div>
                      <Button variant="secondary">
                        <Camera className="w-4 h-4" />
                        Change Avatar
                      </Button>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        glass
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        disabled
                        glass
                      />
                      <Input
                        label="Company Name"
                        value={profile.company_name}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        glass
                      />
                      <Input
                        label="Job Title"
                        value={profile.job_title}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        glass
                      />
                      <Input
                        label="Industry"
                        value={profile.industry}
                        onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        glass
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Size</label>
                        <select
                          value={profile.company_size}
                          onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                          className="w-full px-4 py-2 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black"
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501+">501+ employees</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Workspace Settings */}
              {activeTab === 'workspace' && (
                <Card glass padding="lg">
                  <h2 className="text-xl font-bold mb-6">Workspace Settings</h2>

                  <div className="space-y-6">
                    <Input
                      label="Workspace Name"
                      value={workspace.name}
                      onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                      glass
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={workspace.description}
                        onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black resize-none"
                      />
                    </div>

                    <Input
                      label="Company Name"
                      value={workspace.company_name}
                      onChange={(e) => setWorkspace({ ...workspace, company_name: e.target.value })}
                      glass
                    />

                    <div className="flex justify-end">
                      <Button onClick={() => toast.success('Workspace settings saved')}>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <Card glass padding="lg">
                  <h2 className="text-xl font-bold mb-6">Notification Settings</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-synora-gray-200">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-synora-gray-600">Receive email notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email_notifications}
                          onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-synora-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-synora-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-synora-black"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-synora-gray-200">
                      <div>
                        <h3 className="font-medium">Dataset Upload Complete</h3>
                        <p className="text-sm text-synora-gray-600">When a dataset finishes uploading</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.dataset_upload}
                          onChange={(e) => setNotifications({ ...notifications, dataset_upload: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-synora-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-synora-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-synora-black"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-synora-gray-200">
                      <div>
                        <h3 className="font-medium">AI Query Complete</h3>
                        <p className="text-sm text-synora-gray-600">When AI finishes processing a query</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.ai_query_complete}
                          onChange={(e) => setNotifications({ ...notifications, ai_query_complete: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-synora-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-synora-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-synora-black"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-synora-gray-200">
                      <div>
                        <h3 className="font-medium">Product Updates</h3>
                        <p className="text-sm text-synora-gray-600">News and feature announcements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.product_updates}
                          onChange={(e) => setNotifications({ ...notifications, product_updates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-synora-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-synora-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-synora-black"></div>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveNotifications}>
                        <Save className="w-4 h-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Billing Settings */}
              {activeTab === 'billing' && (
                <Card glass padding="lg">
                  <h2 className="text-xl font-bold mb-6">Billing & Subscription</h2>

                  <div className="space-y-6">
                    {/* Current Plan */}
                    <div className="p-6 bg-synora-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold">Pro Plan</h3>
                          <p className="text-synora-gray-600">$99/month</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm text-synora-gray-600">
                        <li>✓ Unlimited datasets</li>
                        <li>✓ Advanced AI queries</li>
                        <li>✓ Custom reports</li>
                        <li>✓ Priority support</li>
                      </ul>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="font-semibold mb-3">Payment Method</h3>
                      <div className="p-4 bg-synora-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5" />
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-synora-gray-600">Expires 12/2025</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">Update</Button>
                      </div>
                    </div>

                    {/* Billing History */}
                    <div>
                      <h3 className="font-semibold mb-3">Billing History</h3>
                      <div className="space-y-2">
                        {[
                          { date: '2024-01-01', amount: '$99.00', status: 'Paid' },
                          { date: '2023-12-01', amount: '$99.00', status: 'Paid' },
                          { date: '2023-11-01', amount: '$99.00', status: 'Paid' },
                        ].map((invoice, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-synora-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{invoice.amount}</p>
                              <p className="text-sm text-synora-gray-600">{invoice.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-green-600">{invoice.status}</span>
                              <Button variant="secondary" size="sm">Download</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* API Settings */}
              {activeTab === 'api' && (
                <Card glass padding="lg">
                  <h2 className="text-xl font-bold mb-6">API Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">API Key</h3>
                      <div className="p-4 bg-synora-gray-50 rounded-lg">
                        <code className="text-sm font-mono">sk_live_••••••••••••••••••••••••</code>
                      </div>
                      <p className="text-sm text-synora-gray-600 mt-2">
                        Keep your API key secret. Do not share it publicly.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary">Generate New Key</Button>
                      <Button variant="secondary">View Documentation</Button>
                    </div>

                    {/* Connected Services */}
                    <div>
                      <h3 className="font-semibold mb-3">Connected Services</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-synora-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-synora-black rounded-lg flex items-center justify-center text-white font-bold">
                              S
                            </div>
                            <div>
                              <p className="font-medium">Supabase</p>
                              <p className="text-sm text-synora-gray-600">Database & Authentication</p>
                            </div>
                          </div>
                          <span className="text-sm text-green-600">Connected</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-synora-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-synora-black rounded-lg flex items-center justify-center text-white font-bold">
                              D
                            </div>
                            <div>
                              <p className="font-medium">DuckDB</p>
                              <p className="text-sm text-synora-gray-600">Analytics Engine</p>
                            </div>
                          </div>
                          <span className="text-sm text-green-600">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
