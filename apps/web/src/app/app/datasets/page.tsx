'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default function DatasetsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string
    size: string
    type: string
  } | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const allowedExtensions = ['.csv', '.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload CSV or Excel files only.')
      return false
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 100MB.')
      return false
    }

    return true
  }

  const handleFileSelect = (file: File) => {
    setError(null)
    setUploadSuccess(false)
    setUploadedFileInfo(null)

    if (!validateFile(file)) {
      return
    }

    setSelectedFile(file)
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await apiClient.datasets.upload(selectedFile, selectedFile.name)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.success && response.data) {
        const data = response.data as {
          id: string
          name: string
          file_type: string
          file_size: number
        }

        setUploadedFileInfo({
          name: data.name,
          size: formatFileSize(data.file_size),
          type: data.file_type,
        })

        setUploadSuccess(true)
        toast.success('Dataset uploaded successfully!')

        // Redirect to dashboard after 2 seconds with refresh flag
        setTimeout(() => {
          router.push('/app/dashboard?refresh=true')
        }, 2000)
      } else {
        setError(response.error || 'Upload failed. Please try again.')
        toast.error(response.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setError(null)
    setUploadSuccess(false)
    setUploadProgress(0)
    setUploadedFileInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Sources</h1>
        <p className="text-synora-gray-600">Upload and manage your datasets</p>
      </div>

      <Card glass padding="lg">
        {!uploadSuccess ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                isDragging
                  ? 'border-synora-black bg-synora-gray-100'
                  : 'border-synora-gray-300 hover:border-synora-gray-400'
              } ${selectedFile ? 'bg-synora-gray-50' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="text-center">
                {!selectedFile ? (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">
                      Drop your file here, or browse
                    </h3>
                    <p className="text-sm text-synora-gray-600 mb-4">
                      Supports CSV and Excel files (max 100MB)
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      Select File
                    </Button>
                  </>
                ) : (
                  <>
                    <File className="w-16 h-16 mx-auto mb-4 text-synora-black" />
                    <h3 className="text-lg font-semibold mb-1">{selectedFile.name}</h3>
                    <p className="text-sm text-synora-gray-600 mb-4">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    {!uploading && (
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={handleUpload} disabled={uploading}>
                          Upload Dataset
                        </Button>
                        <Button variant="secondary" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-synora-gray-600">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-synora-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-synora-black h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-600" />
            <h3 className="text-2xl font-bold mb-2">Upload Successful!</h3>
            <p className="text-synora-gray-600 mb-6">
              Your dataset has been uploaded and is being processed
            </p>

            {uploadedFileInfo && (
              <Card className="inline-block text-left mb-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-sm text-synora-gray-600">File Name:</span>
                    <span className="font-medium">{uploadedFileInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-sm text-synora-gray-600">File Size:</span>
                    <span className="font-medium">{uploadedFileInfo.size}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-sm text-synora-gray-600">File Type:</span>
                    <span className="font-medium uppercase">{uploadedFileInfo.type}</span>
                  </div>
                </div>
              </Card>
            )}

            <p className="text-sm text-synora-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
