'use client'

import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Database, Palette } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: User,
    description: 'Manage your personal information',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure notification preferences',
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Password, 2FA, and privacy settings',
  },
  {
    id: 'data',
    title: 'Data Management',
    icon: Database,
    description: 'Storage, backups, and data retention',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Theme and display preferences',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="heading-3 mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="body-regular">Manage your account and application preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card glass hover className="cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{section.title}</h3>
                  <p className="text-sm text-synora-gray-600">{section.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card glass>
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            Export Data
          </Button>
          <Button variant="secondary" className="w-full justify-start text-red-600 hover:bg-red-50">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  )
}
