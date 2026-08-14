'use client'

import { motion } from 'framer-motion'
import { Users, UserPlus, Mail, MoreVertical, Shield, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const teamMembers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Admin',
    avatar: 'JD',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'Analyst',
    avatar: 'JS',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@company.com',
    role: 'Viewer',
    avatar: 'MJ',
    status: 'Active',
  },
]

export default function TeamPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-3 mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Team
          </h1>
          <p className="body-regular">Manage your team members and permissions</p>
        </div>
        <Button>
          <UserPlus className="w-5 h-5 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 gap-4">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card glass hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-synora-black rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{member.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-synora-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {member.role === 'Admin' ? (
                          <Shield className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        {member.role}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-synora-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
