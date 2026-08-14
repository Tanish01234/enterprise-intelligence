'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Database,
  LineChart,
  Brain,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Command,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Copilot', href: '/dashboard/copilot', icon: Brain },
  { name: 'DataMart', href: '/dashboard/datamart', icon: Database },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-synora-gray-50">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className="fixed top-0 left-0 h-full w-80 bg-synora-white border-r border-synora-gray-200 z-50 lg:translate-x-0 transition-transform duration-200"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-synora-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-bold">Synora</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-synora-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={
                      isActive
                        ? 'nav-item-active'
                        : 'nav-item'
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-synora-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-synora-gray-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-synora-black rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-synora-white">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">John Doe</div>
                <div className="text-xs text-synora-gray-600 truncate">john@company.com</div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-synora-gray-200">
          <div className="flex items-center justify-between h-20 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-synora-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-2xl mx-auto">
              <button className="w-full flex items-center gap-3 px-4 py-2 bg-synora-gray-100 rounded-lg hover:bg-synora-gray-200 transition-colors">
                <Search className="w-5 h-5 text-synora-gray-400" />
                <span className="text-sm text-synora-gray-600">Search...</span>
                <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-synora-white rounded text-xs text-synora-gray-500">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2 hover:bg-synora-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
