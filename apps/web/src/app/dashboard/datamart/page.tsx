'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'

interface Dataset {
  id: string
  name: string
  file_type: string
  file_size: number
  status: string
  row_count?: number
  column_count?: number
  created_at: string
}

export default function DataMartPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDatasets()
  }, [])

  const loadDatasets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.datasets.list()
      
      if (response.success && response.data) {
        const data = response.data as { datasets?: Dataset[]; total?: number }
        setDatasets(data.datasets || [])
      } else {
        setError('Failed to load datasets')
      }
    } catch (err) {
      console.error('Failed to load datasets:', err)
      setError('Failed to load datasets. Using demo mode.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      
      const response = await apiClient.datasets.upload(file, file.name)
      
      if (response.success) {
        await loadDatasets()
      } else {
        setError(response.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return

    try {
      const response = await apiClient.datasets.delete(id)
      if (response.success) {
        await loadDatasets()
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete dataset')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && datasets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-synora-gray-400" />
          <p className="text-lg text-synora-gray-600">Loading datasets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-3 mb-2 flex items-center gap-2">
            <Database className="w-8 h-8" />
            DataMart
          </h1>
          <p className="body-regular">Manage and explore your datasets</p>
        </div>
        <label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json,.parquet"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Dataset
              </>
            )}
          </Button>
        </label>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <Card glass padding="sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-synora-gray-100 rounded-lg">
            <Search className="w-5 h-5 text-synora-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets..."
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>
          <Button variant="secondary">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Datasets Grid */}
      {filteredDatasets.length === 0 ? (
        <Card glass className="text-center py-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No datasets found</h3>
          <p className="text-synora-gray-600 mb-6">
            {searchQuery ? 'Try a different search query' : 'Upload your first dataset to get started'}
          </p>
          {!searchQuery && (
            <label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json,.parquet"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button>
                <Upload className="w-5 h-5 mr-2" />
                Upload Dataset
              </Button>
            </label>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset, index) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card glass hover className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    {getStatusIcon(dataset.status)}
                  </div>
                  <button className="p-2 hover:bg-synora-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="font-semibold mb-2 truncate">{dataset.name}</h3>
                
                <div className="space-y-2 text-sm text-synora-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{dataset.file_type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(dataset.file_size)}</span>
                  </div>
                  {dataset.row_count && (
                    <div className="flex justify-between">
                      <span>Rows:</span>
                      <span className="font-medium">{dataset.row_count.toLocaleString()}</span>
                    </div>
                  )}
                  {dataset.column_count && (
                    <div className="flex justify-between">
                      <span>Columns:</span>
                      <span className="font-medium">{dataset.column_count}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(dataset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
