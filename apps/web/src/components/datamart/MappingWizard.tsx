'use client'

import React, { useState } from 'react'
import { ColumnDetected, UploadResult } from './CsvUploader'
import { Check, ArrowRight, Table, Layers, AlertCircle, Loader2 } from 'lucide-react'

interface MappingWizardProps {
  uploadResult: UploadResult
  onMappingComplete: (ingestionResult: any) => void
  apiBaseUrl?: string
}

const TARGET_ENTITIES = [
  {
    id: 'orders',
    name: 'Orders & Sales',
    description: 'Order numbers, totals, dates, customer references',
    requiredFields: ['order_number', 'total_amount'],
    availableFields: ['order_number', 'customer_id', 'order_date', 'subtotal', 'tax_amount', 'total_amount', 'currency'],
  },
  {
    id: 'products',
    name: 'Products & Inventory',
    description: 'Product SKUs, names, unit prices, stock levels',
    requiredFields: ['sku', 'name', 'unit_price'],
    availableFields: ['sku', 'name', 'category_id', 'unit_price', 'cost_price', 'stock_quantity'],
  },
  {
    id: 'customers',
    name: 'Customers & Segments',
    description: 'Customer names, emails, segments, regions',
    requiredFields: ['name'],
    availableFields: ['external_id', 'name', 'email', 'phone', 'segment', 'region_id'],
  },
]

export default function MappingWizard({
  uploadResult,
  onMappingComplete,
  apiBaseUrl = '/api/v1',
}: MappingWizardProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>('orders')
  const columns: ColumnDetected[] = uploadResult.columns_metadata?.columns || []

  // Default mapping rules state: csv_col -> target_field
  const [mappingRules, setMappingRules] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    columns.forEach((col) => {
      const lower = col.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      // Auto-match standard field names
      if (lower.includes('order') && lower.includes('number')) initial[col.name] = 'order_number'
      else if (lower.includes('amount') || lower.includes('total')) initial[col.name] = 'total_amount'
      else if (lower.includes('price')) initial[col.name] = 'unit_price'
      else if (lower.includes('sku')) initial[col.name] = 'sku'
      else if (lower.includes('name')) initial[col.name] = 'name'
      else if (lower.includes('date')) initial[col.name] = 'order_date'
      else initial[col.name] = ''
    })
    return initial
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entityConfig = TARGET_ENTITIES.find((e) => e.id === selectedEntity) || TARGET_ENTITIES[0]

  const handleFieldChange = (csvCol: string, targetField: string) => {
    setMappingRules((prev) => ({ ...prev, [csvCol]: targetField }))
  }

  const validateMapping = (): boolean => {
    setError(null)
    const mappedValues = Object.values(mappingRules)
    const missing = entityConfig.requiredFields.filter((req) => !mappedValues.includes(req))
    if (missing.length > 0) {
      setError(`Required field(s) missing: ${missing.join(', ')}`)
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateMapping()) return

    setIsSubmitting(true)
    setError(null)

    // Filter out unmapped columns
    const cleanRules: Record<string, string> = {}
    Object.entries(mappingRules).forEach(([csvCol, targetField]) => {
      if (targetField) cleanRules[csvCol] = targetField
    })

    try {
      const response = await fetch(`${apiBaseUrl}/datamart/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: uploadResult.id,
          target_entity: selectedEntity,
          mapping_rules: cleanRules,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to apply column mapping')
      }

      const result = await response.json()
      setIsSubmitting(false)
      onMappingComplete(result)
    } catch (err: any) {
      setIsSubmitting(false)
      setError(err.message || 'Error processing mapping ingestion')
    }
  }

  return (
    <div className="w-full space-y-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      {/* Step 1: Select Target Entity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          1. Select Target Domain Entity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TARGET_ENTITIES.map((entity) => {
            const isSelected = selectedEntity === entity.id
            return (
              <div
                key={entity.id}
                onClick={() => setSelectedEntity(entity.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{entity.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-xs text-white/40 mt-1">{entity.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 2: Column Mapping Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-400" />
          2. Map CSV Columns to {entityConfig.name} Fields
        </h3>

        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-white/5 text-white/40 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">CSV Header</th>
                <th className="px-4 py-3">Detected Type</th>
                <th className="px-4 py-3">Sample Values</th>
                <th className="px-4 py-3">Target Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {columns.map((col) => (
                <tr key={col.name} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-white/90">{col.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-purple-300 font-mono">
                      {col.inferred_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 max-w-xs truncate">
                    {col.sample_values?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mappingRules[col.name] || ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">-- Do Not Import --</option>
                      {entityConfig.availableFields.map((field) => (
                        <option key={field} value={field}>
                          {field} {entityConfig.requiredFields.includes(field) ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <p className="text-xs text-white/40">
          Required fields for {entityConfig.name}:{' '}
          <span className="text-purple-300 font-mono">{entityConfig.requiredFields.join(', ')}</span>
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-accent text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Ingesting Data...
            </>
          ) : (
            <>
              Confirm & Ingest Data
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
