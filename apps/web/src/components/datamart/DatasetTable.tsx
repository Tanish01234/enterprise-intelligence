'use client'

import React, { useState } from 'react'
import { Search, FileSpreadsheet, Trash2, Calendar, HardDrive, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export interface DatasetItem {
  id: string
  filename: string
  file_size_bytes: number
  row_count: number | null
  column_count: number | null
  delimiter: string
  status: 'pending' | 'mapped' | 'ingesting' | 'completed' | 'failed'
  created_at: string
}

interface DatasetTableProps {
  datasets: DatasetItem[]
  onDeleteDataset?: (id: string) => void
  isLoading?: boolean
}

export default function DatasetTable({ datasets, onDeleteDataset, isLoading = false }: DatasetTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredDatasets = datasets.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: DatasetItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        )
      case 'ingesting':
      case 'pending':
      case 'mapped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3 animate-spin" /> {status}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Dataset Name</th>
              <th className="px-5 py-3.5">File Size</th>
              <th className="px-5 py-3.5">Rows / Columns</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Uploaded Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-white/40">
                  Loading datasets...
                </td>
              </tr>
            ) : filteredDatasets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-white/40">
                  No datasets found. Upload a CSV file to get started.
                </td>
              </tr>
            ) : (
              filteredDatasets.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-semibold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span>{item.filename}</span>
                  </td>
                  <td className="px-5 py-4 text-white/60">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-white/30" />
                      {(item.file_size_bytes / 1024).toFixed(1)} KB
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/80 font-mono">
                    {item.row_count ?? '—'} rows / {item.column_count ?? '—'} cols
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-5 py-4 text-white/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/30" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {onDeleteDataset && (
                      <button
                        onClick={() => onDeleteDataset(item.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
