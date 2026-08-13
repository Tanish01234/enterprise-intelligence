'use client'

import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'

export default function AnalyticsOverviewPage() {
  const { currentOrganization } = useOrg()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">DataMart & Analytics</h1>
        <p className="mt-1 text-white/50 text-sm">
          Ingest raw CSV business datasets, map column schemas, and run DuckDB OLAP analytics for{' '}
          <span className="text-purple-400 font-medium">{currentOrganization?.name || 'your organization'}</span>.
        </p>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/analytics/upload"
          className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
            Upload CSV Dataset
          </h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            Upload business CSV data with automated delimiter detection, column type inference, and validation.
          </p>
        </Link>

        <Link
          href="/analytics/datasets"
          className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
            View Uploaded Datasets
          </h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            Inspect dataset inventory, row counts, schema mappings, and ingestion job statuses.
          </p>
        </Link>

        <Link
          href="/analytics/dashboard"
          className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v6.75m3-9v9m3-6.75v6.75m3-12v12c0 1.242-1.008 2.25-2.25 2.25H4.5A2.25 2.25 0 012.25 18V6c0-1.242 1.008-2.25 2.25-2.25h15c1.242 0 2.25 1.008 2.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
            Executive KPI Dashboard
          </h3>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            Explore real-time revenue trends, AOV, customer segment distributions, and product category metrics.
          </p>
        </Link>
      </div>

      {/* Module Overview Info */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/10 p-8">
        <h3 className="text-lg font-semibold text-white mb-2">Phase 3 Features</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/70">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            CSV File Upload & Schema Auto-Detection
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Column Schema Mapping to Orders, Products, Customers
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            In-Memory DuckDB OLAP Analytics Engine
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Multi-Tenant Organization Isolation with Postgres RLS
          </li>
        </ul>
      </div>
    </div>
  )
}
