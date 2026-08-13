'use client'

import { useAuth } from '@/hooks/useAuth'
import { useOrg } from '@/hooks/useOrg'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

// ──────────────────────────────────────────
// Organization Selector Component
// ──────────────────────────────────────────

function OrgSelector() {
  const { organizations, currentOrganization, setCurrentOrganization, createOrganization, loading } = useOrg()
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSelect = async (orgId: string) => {
    await setCurrentOrganization(orgId)
    setIsOpen(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const { error } = await createOrganization(newOrgName, newOrgSlug)
      if (error) throw error
      setShowCreate(false)
      setNewOrgName('')
      setNewOrgSlug('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsCreating(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setNewOrgName(name)
    setNewOrgSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    )
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="h-10 rounded-lg animate-shimmer" />
      </div>
    )
  }

  return (
    <div className="relative px-3">
      {/* Selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {currentOrganization?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">
            {currentOrganization?.name || 'Select organization'}
          </p>
          <p className="text-xs text-white/40 truncate">
            {currentOrganization?.slug || 'No org selected'}
          </p>
        </div>
        <svg className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-3 right-3 top-full mt-2 z-50 rounded-xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="p-1.5 max-h-60 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    currentOrganization?.id === org.id
                      ? 'bg-purple-500/20 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    <p className="text-xs text-white/40 truncate">{org.slug}</p>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 p-1.5">
              <button
                onClick={() => { setShowCreate(true); setIsOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-150 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New organization
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Organization Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create organization</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {createError}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="org-name" className="block text-sm font-medium text-white/80">
                  Organization name
                </label>
                <input
                  id="org-name"
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="org-slug" className="block text-sm font-medium text-white/80">
                  URL slug
                </label>
                <input
                  id="org-slug"
                  type="text"
                  required
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  pattern="[a-z0-9-]+"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="acme-corp"
                />
                <p className="text-xs text-white/40">Lowercase letters, numbers, and hyphens only</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white gradient-accent hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                >
                  {isCreating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Navigation Items
// ──────────────────────────────────────────

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: 'Analytics Overview',
    href: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    name: 'Upload Dataset',
    href: '/analytics/upload',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    name: 'Datasets',
    href: '/analytics/datasets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    name: 'KPI Dashboard',
    href: '/analytics/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v6.75m3-9v9m3-6.75v6.75m3-12v12c0 1.242-1.008 2.25-2.25 2.25H4.5A2.25 2.25 0 012.25 18V6c0-1.242 1.008-2.25 2.25-2.25h15c1.242 0 2.25 1.008 2.25 2.25z" />
      </svg>
    ),
  },
]

// ──────────────────────────────────────────
// Sidebar Component
// ──────────────────────────────────────────

function Sidebar({ currentPath }: { currentPath: string }) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-950 border-r border-white/5 flex flex-col z-30">
      {/* Brand */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Enterprise Intel</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Platform</p>
          </div>
        </div>
      </div>

      {/* Org Selector */}
      <div className="py-3">
        <OrgSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-purple-500/15 text-purple-300 shadow-sm'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span className={isActive ? 'text-purple-400' : 'text-white/40'}>{item.icon}</span>
              {item.name}
            </Link>
          )
        })}

        {/* Placeholder sections for future modules */}
        <p className="px-3 py-2 mt-4 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Modules
        </p>
        <div className="space-y-1">
          {['DataMart', 'Analytics', 'Strategy Lab', 'Retail Intel'].map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/20 cursor-not-allowed"
            >
              <div className="w-5 h-5 rounded bg-white/5" />
              {name}
              <span className="ml-auto text-[9px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded-full">Soon</span>
            </div>
          ))}
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

// ──────────────────────────────────────────
// Application Shell Export
// ──────────────────────────────────────────

export default function AppShell({
  children,
  currentPath,
}: {
  children: React.ReactNode
  currentPath: string
}) {
  const { user, loading: authLoading } = useAuth()
  const { currentOrganization, organizations, loading: orgLoading } = useOrg()

  // Loading state
  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center animate-float shadow-lg shadow-purple-500/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-sm text-white/40">Loading Enterprise Intelligence…</p>
        </div>
      </div>
    )
  }

  // Not authenticated — should be handled by middleware, but just in case
  if (!user) {
    return null
  }

  // No org selected and orgs exist — show org selection prompt
  if (!currentOrganization && organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <OrgOnboarding />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar currentPath={currentPath} />
      <main className="pl-64">
        <div className="p-6 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}

// ──────────────────────────────────────────
// Organization Onboarding (First-time)
// ──────────────────────────────────────────

function OrgOnboarding() {
  const { createOrganization } = useOrg()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      const { error } = await createOrganization(name, slug)
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent mb-6 shadow-lg shadow-purple-500/25 animate-float">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Create your organization</h2>
      <p className="text-white/50 text-sm mb-8">
        Organizations help you manage teams, data, and analytics in isolated workspaces.
      </p>

      <div className="glass rounded-2xl p-6 bg-white/5 border border-white/10 text-left">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="onboard-org-name" className="block text-sm font-medium text-white/80">
              Organization name
            </label>
            <input
              id="onboard-org-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              placeholder="Acme Corporation"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="onboard-org-slug" className="block text-sm font-medium text-white/80">
              URL slug
            </label>
            <input
              id="onboard-org-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9-]+"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              placeholder="acme-corp"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3 rounded-xl font-semibold text-white gradient-accent hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
          >
            {isCreating ? 'Creating…' : 'Get started'}
          </button>
        </form>
      </div>
    </div>
  )
}
