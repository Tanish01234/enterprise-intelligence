'use client'

import { useEffect, useState } from 'react'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import DatasetTable, { DatasetItem } from '@/components/datamart/DatasetTable'

export default function AnalyticsDatasetsPage() {
  const { currentOrganization } = useOrg()
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchDatasets = async () => {
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (currentOrganization?.id) {
        headers['X-Organization-ID'] = currentOrganization.id
      }
      const response = await fetch('/api/v1/datamart/datasets', { headers })
      if (response.ok) {
        const data = await response.json()
        setDatasets(data)
      } else {
        setDatasets([])
      }
    } catch {
      setDatasets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [currentOrganization?.id])

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return
    try {
      const headers: Record<string, string> = {}
      if (currentOrganization?.id) {
        headers['X-Organization-ID'] = currentOrganization.id
      }
      await fetch(`/api/v1/datamart/datasets/${id}`, {
        method: 'DELETE',
        headers,
      })
      setDatasets((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Datasets Inventory</h1>
          <p className="mt-1 text-white/50 text-sm">
            Manage business datasets for{' '}
            <span className="text-purple-400 font-medium">{currentOrganization?.name || 'your organization'}</span>.
          </p>
        </div>
        <Link
          href="/analytics/upload"
          className="px-4 py-2 rounded-xl gradient-accent text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all"
        >
          + Upload New Dataset
        </Link>
      </div>

      {/* Dataset Table Component */}
      <DatasetTable
        datasets={datasets}
        onDeleteDataset={handleDeleteDataset}
        isLoading={isLoading}
      />
    </div>
  )
}
