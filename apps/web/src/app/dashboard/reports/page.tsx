'use client'

import { motion } from 'framer-motion'
import { FileText, Plus, Download, Calendar, Filter } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const reports = [
  {
    id: 1,
    title: 'Q2 2024 Performance Report',
    type: 'Executive Summary',
    date: '2024-06-30',
    status: 'Completed',
  },
  {
    id: 2,
    title: 'Customer Analytics Dashboard',
    type: 'Analytics',
    date: '2024-06-28',
    status: 'Completed',
  },
  {
    id: 3,
    title: 'Product Revenue Analysis',
    type: 'Financial',
    date: '2024-06-25',
    status: 'Completed',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-3 mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Reports
          </h1>
          <p className="body-regular">Generate and manage your analytics reports</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Button variant="secondary">
          <Calendar className="w-5 h-5 mr-2" />
          Date Range
        </Button>
        <Button variant="secondary">
          <Filter className="w-5 h-5 mr-2" />
          Filter
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card glass hover className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{report.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-synora-gray-600">
                    <span>{report.type}</span>
                    <span>•</span>
                    <span>{new Date(report.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-green-600">{report.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  View
                </Button>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
