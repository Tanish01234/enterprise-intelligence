'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  BarChart3, 
  Brain, 
  Database, 
  FileText, 
  Users, 
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Building2,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'AI Queries', href: '/app/queries', icon: Brain },
  { name: 'Data Sources', href: '/app/datasets', icon: Database },
  { name: 'Reports', href: '/app/reports', icon: FileText },
  { name: 'Team', href: '/app/team', icon: Users },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  
  // User and organization data
  const [user, setUser] = useState({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: 'L',
  })
  const [organizations, setOrganizations] = useState<any[]>([])
  const [currentOrg, setCurrentOrg] = useState<any>(null)

  useEffect(() => {
    loadUserData()
    loadOrganizations()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await apiClient.profiles.me()
      if (response.success && response.data) {
        const profile = response.data as any
        setUser({
          name: profile.full_name || profile.email,
          email: profile.email,
          avatar: (profile.full_name || profile.email).substring(0, 2).toUpperCase(),
        })
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.organizations.list()
      if (response.success && response.data) {
        const orgs = response.data as any[]
        setOrganizations(orgs)
        if (orgs.length > 0) {
          setCurrentOrg(orgs[0])
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Compact Sidebar for Laptops */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-synora-gray-200 z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Compact Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-synora-gray-200">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-lg font-bold">Synora</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-synora-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Workspace Switcher */}
        <div className="px-3 py-2 border-b border-synora-gray-200">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="w-full px-2.5 py-1.5 bg-synora-gray-50 hover:bg-synora-gray-100 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-synora-black rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-medium truncate">{currentOrg?.name || 'My Organization'}</div>
                <div className="text-[10px] text-synora-gray-600 truncate">
                  {organizations.length} {organizations.length === 1 ? 'workspace' : 'workspaces'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-synora-gray-600 flex-shrink-0" />
          </button>

          {/* Workspace Dropdown */}
          <AnimatePresence>
            {workspaceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-1.5 bg-white border border-synora-gray-200 rounded-lg shadow-lg"
              >
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setCurrentOrg(org)}
                    className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors"
                  >
                    {org.name}
                  </button>
                ))}
                <div className="my-1.5 border-t border-synora-gray-200" />
                <Link href="/app/settings/organizations">
                  <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Manage Organizations
                  </button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compact Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-synora-black text-white'
                        : 'text-synora-gray-700 hover:bg-synora-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Compact User Section */}
        <div className="px-3 py-2 border-t border-synora-gray-200">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-synora-gray-100 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-synora-black rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{user.avatar}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-synora-gray-600 truncate">{user.email}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-synora-gray-600 flex-shrink-0" />
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white border border-synora-gray-200 rounded-lg shadow-xl"
                >
                  <div className="px-2.5 py-1.5 border-b border-synora-gray-200 mb-1.5">
                    <div className="text-[10px] text-synora-gray-600">Signed in as</div>
                    <div className="text-xs font-medium truncate">{user.email}</div>
                  </div>
                  
                  <Link href="/app/settings/profile">
                    <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      Profile
                    </button>
                  </Link>
                  
                  <Link href="/app/settings/workspace">
                    <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      Workspace Settings
                    </button>
                  </Link>
                  
                  <Link href="/app/settings/billing">
                    <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      Billing
                    </button>
                  </Link>
                  
                  <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-synora-gray-50 rounded-lg transition-colors flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Support
                  </button>
                  
                  <div className="my-1.5 border-t border-synora-gray-200" />
                  
                  <Link href="/auth/signout">
                    <button className="w-full px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content - Adjusted for 256px sidebar */}
      <div className="lg:pl-64">
        {/* Compact Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-synora-gray-200">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 hover:bg-synora-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Compact Breadcrumb */}
              <div className="hidden md:flex items-center gap-1.5 text-sm">
                <Link href="/app/dashboard" className="text-synora-gray-600 hover:text-synora-black text-xs">
                  {currentOrg?.name || 'Dashboard'}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-synora-gray-400" />
                <span className="font-medium text-synora-black text-xs">
                  {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Compact Search */}
              <button className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-synora-gray-100 hover:bg-synora-gray-200 rounded-lg transition-colors">
                <Search className="w-3.5 h-3.5 text-synora-gray-600" />
                <span className="text-xs text-synora-gray-600">Search...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-synora-gray-300 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Compact Notifications */}
              <button className="relative p-1.5 hover:bg-synora-gray-100 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Compact Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
