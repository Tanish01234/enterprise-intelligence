'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  fullWidth?: boolean
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className,
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantStyles = {
    primary: 'bg-synora-black text-synora-white hover:bg-synora-gray-900 focus:ring-synora-gray-400 active:scale-95',
    secondary: 'bg-synora-white text-synora-black border border-synora-gray-300 hover:bg-synora-gray-50 focus:ring-synora-gray-400 active:scale-95',
    ghost: 'text-synora-gray-700 hover:bg-synora-gray-100 focus:ring-synora-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 active:scale-95',
  }
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-6 py-2.5 text-base gap-2',
    lg: 'px-8 py-3.5 text-lg gap-2.5',
  }
  
  const widthStyle = fullWidth ? 'w-full' : ''
  
  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyle,
        disabledStyles,
        className
      )}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </motion.button>
  )
}
