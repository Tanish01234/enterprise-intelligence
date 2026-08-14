'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Filter, Plus, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [datasets, setDatasets] = useState<any[]>([])

  useEffect(() => {
    loadDatasets()
    loadReports()
  }, [])

  const loadDatasets = async () => {
    try {
      const response = await apiClient.datasets.list(0, 100)
      if (response.success && response.data) {
        const data = response.data as { datasets: any[]; total: number }
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('Failed to load datasets:', error)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      // Reports API not yet implemented - showing empty state
      setReports([])
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (datasets.length === 0) {
      toast.error('No datasets available to export')
      return
    }

    // Use the first dataset for export (or let user select)
    const datasetId = datasets[0].id

    try {
      const response = await apiClient.datasets.exportCsv(datasetId)
      if (response.success) {
        toast.success('CSV exported successfully!')
      } else {
        toast.error(response.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  if (datasets.length === 0 && !loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-synora-gray-600">Generate and download reports</p>
        </div>

        <Card glass padding="lg">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Datasets Yet</h3>
            <p className="text-synora-gray-600 mb-4">
              Upload a dataset to start generating reports
            </p>
            <Button onClick={() => window.location.href = '/app/datasets'}>
              Upload Dataset
            </Button>
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
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-synora-gray-600">Generate and download reports</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadReports}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button onClick={handleGenerateReport}>
            <Plus className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass hover className="cursor-pointer" onClick={handleGenerateReport}>
          <div className="flex flex-col items-center text-center p-4">
            <FileText className="w-12 h-12 mb-3 text-synora-black" />
            <h3 className="font-semibold mb-1">CSV Export</h3>
            <p className="text-sm text-synora-gray-600">
              Export your data to CSV format
            </p>
          </div>
        </Card>

        <Card glass hover className="cursor-pointer opacity-50">
          <div className="flex flex-col items-center text-center p-4">
            <FileText className="w-12 h-12 mb-3 text-synora-gray-400" />
            <h3 className="font-semibold mb-1">PDF Report</h3>
            <p className="text-sm text-synora-gray-600">
              Generate detailed PDF reports (Coming Soon)
            </p>
          </div>
        </Card>

        <Card glass hover className="cursor-pointer opacity-50">
          <div className="flex flex-col items-center text-center p-4">
            <FileText className="w-12 h-12 mb-3 text-synora-gray-400" />
            <h3 className="font-semibold mb-1">Excel Export</h3>
            <p className="text-sm text-synora-gray-600">
              Export to Excel format (Coming Soon)
            </p>
          </div>
        </Card>

        <Card glass hover className="cursor-pointer opacity-50">
          <div className="flex flex-col items-center text-center p-4">
            <FileText className="w-12 h-12 mb-3 text-synora-gray-400" />
            <h3 className="font-semibold mb-1">Scheduled Reports</h3>
            <p className="text-sm text-synora-gray-600">
              Set up automatic generation (Coming Soon)
            </p>
          </div>
        </Card>
      </div>

      {/* Reports List */}
      <Card glass>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Report History</h2>
          
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 text-synora-gray-400" />
              <p className="text-synora-gray-600">No reports generated yet</p>
              <p className="text-sm text-synora-gray-500 mt-1">
                Click "Generate Report" to create your first report
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg hover:bg-synora-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-synora-gray-600" />
                    <div>
                      <h3 className="font-medium">{report.report_name}</h3>
                      <p className="text-sm text-synora-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
