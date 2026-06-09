import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline'

interface BadgeProps {
  className?: string
  variant?: BadgeVariant
  children?: React.ReactNode
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-[var(--bg-elevated)] text-slate-300 border-slate-700/50',
  success:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:   'bg-red-500/10 text-red-400 border-red-500/20',
  info:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple:   'bg-violet-500/10 text-violet-400 border-violet-500/20',
  outline:  'bg-transparent text-[var(--text-secondary)] border-[var(--border)]10',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  purple:  'bg-violet-400',
  outline: 'bg-slate-400',
}

function Badge({ className, variant = 'default', children, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-medium border transition-colors duration-200',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotStyles[variant])}
        />
      )}
      {children}
    </span>
  )
}

export { Badge, type BadgeVariant }