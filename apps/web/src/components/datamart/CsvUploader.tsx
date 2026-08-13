'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export interface ColumnDetected {
  name: string
  inferred_type: string
  sample_values: any[]
  null_count: number
}

export interface UploadResult {
  id: string
  filename: string
  file_size_bytes: number
  row_count: number
  column_count: number
  delimiter: string
  columns_metadata: {
    columns: ColumnDetected[]
  }
}

interface CsvUploaderProps {
  onUploadSuccess: (result: UploadResult) => void
  apiBaseUrl?: string
}

export default function CsvUploader({ onUploadSuccess, apiBaseUrl = '/api/v1' }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file format. Only .csv files are allowed.')
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.')
      return false
    }
    return true
  }

  const processFile = async (file: File) => {
    if (!validateFile(file)) return

    setUploadedFile(file)
    setIsUploading(true)
    setUploadProgress(15)

    try {
      const formData = new FormData()
      formData.append('file', file)

      setUploadProgress(45)

      const response = await fetch(`${apiBaseUrl}/datamart/upload`, {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(85)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to upload CSV file')
      }

      const result: UploadResult = await response.json()
      setUploadProgress(100)
      setIsUploading(false)
      onUploadSuccess(result)
    } catch (err: any) {
      setIsUploading(false)
      setError(err.message || 'Error uploading file')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0])
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              {isUploading
                ? 'Analyzing and uploading CSV...'
                : 'Click to upload or drag & drop CSV file'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Supports standard CSV files up to 50MB (UTF-8 encoded)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-6 max-w-xs mx-auto">
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2">{uploadProgress}% complete</p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success File Summary */}
      {uploadedFile && !isUploading && !error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs font-semibold text-white">{uploadedFile.name}</p>
              <p className="text-[10px] text-white/40">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
      )}
    </div>
  )
}
