// apps/web/src/components/motion/glass-card.tsx
// Skill: Impeccable craft floor — glass as a specific effect (not decoration)
// Apple HIG liquid-glass.md: backdrop-filter only where surface depth is earned
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { staggerItem } from '@/lib/motion'

interface Props {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  animate?: boolean
  intensity?: 'low' | 'medium' | 'high'
}

const BLUR = { low: 'blur(8px)', medium: 'blur(14px)', high: 'blur(24px)' } as const
const BG = {
  low: 'rgba(255,255,255,0.04)',
  medium: 'rgba(255,255,255,0.06)',
  high: 'rgba(255,255,255,0.09)',
} as const

const BASE_STYLE: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.08)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
}

export default function GlassCard({
  children,
  className = '',
  style,
  animate = false,
  intensity = 'medium',
}: Props) {
  const glassStyle: React.CSSProperties = {
    background: BG[intensity],
    backdropFilter: BLUR[intensity],
    WebkitBackdropFilter: BLUR[intensity],
    ...BASE_STYLE,
    ...style,
  }

  if (animate) {
    return (
      <motion.div
        variants={staggerItem}
        whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn('rounded-2xl border', className)}
        style={glassStyle}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={cn('rounded-2xl border', className)} style={glassStyle}>
      {children}
    </div>
  )
}