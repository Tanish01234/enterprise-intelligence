'use client'

import { useState } from 'react'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import CsvUploader, { UploadResult } from '@/components/datamart/CsvUploader'
import MappingWizard from '@/components/datamart/MappingWizard'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function AnalyticsUploadPage() {
  const { currentOrganization } = useOrg()
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [ingestionComplete, setIngestionComplete] = useState<boolean>(false)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Upload & Map CSV Dataset</h1>
          <p className="mt-1 text-white/50 text-sm">
            Import raw business CSV files into{' '}
            <span className="text-purple-400 font-medium">{currentOrganization?.name || 'your organization'}</span>.
          </p>
        </div>
        <Link
          href="/analytics/datasets"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
        >
          View All Datasets
        </Link>
      </div>

      {/* Step 1: Uploading */}
      {!uploadResult && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Step 1: Upload CSV File</h3>
          <CsvUploader onUploadSuccess={(res) => setUploadResult(res)} />
        </div>
      )}

      {/* Step 2: Schema Mapping */}
      {uploadResult && !ingestionComplete && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Step 2: Configure Column Mapping</h3>
            <button
              onClick={() => setUploadResult(null)}
              className="text-xs text-white/40 hover:text-white underline"
            >
              Upload Different File
            </button>
          </div>
          <MappingWizard
            uploadResult={uploadResult}
            onMappingComplete={() => setIngestionComplete(true)}
          />
        </div>
      )}

      {/* Step 3: Success Screen */}
      {ingestionComplete && (
        <div className="rounded-2xl bg-white/[0.03] border border-green-500/20 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Dataset Ingested Successfully!</h3>
            <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
              Your CSV data has been schema-mapped and processed into your organization&apos;s isolated DataMart.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/analytics/dashboard"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-accent text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all"
            >
              Go to Executive Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setUploadResult(null)
                setIngestionComplete(false)
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
            >
              Upload Another CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
