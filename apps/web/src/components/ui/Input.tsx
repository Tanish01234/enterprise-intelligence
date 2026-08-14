'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  glass?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, glass = false, leftIcon, rightIcon, className, ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-synora-black focus:border-transparent'
    
    const glassStyles = glass
      ? 'bg-white/50 backdrop-blur-sm border border-synora-gray-300'
      : 'bg-synora-white border border-synora-gray-300'
    
    const errorStyles = error ? 'border-red-500 focus:ring-red-500' : ''
    const iconPadding = leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-synora-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-synora-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              baseStyles,
              glassStyles,
              errorStyles,
              iconPadding,
              'placeholder:text-synora-gray-400',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-synora-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
