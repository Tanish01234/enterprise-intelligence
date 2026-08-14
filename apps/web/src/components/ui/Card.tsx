'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  glass = false,
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const baseStyles = 'rounded-2xl border transition-all duration-200'
  const glassStyles = glass
    ? 'bg-white/80 backdrop-blur-xl border-synora-gray-200 shadow-glass'
    : 'bg-synora-white border-synora-gray-200 shadow-sm'
  
  const hoverStyles = hover ? 'hover:shadow-premium cursor-pointer' : ''
  const clickStyles = onClick ? 'cursor-pointer' : ''

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      onClick={onClick}
      className={cn(
        baseStyles,
        glassStyles,
        hoverStyles,
        clickStyles,
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
