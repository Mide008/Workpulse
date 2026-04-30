import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value?: number
  max?: number
  className?: string
  trackClassName?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue'
  animated?: boolean
}

const sizeMap = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }
const colorMap = {
  indigo:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  blue:    'bg-blue-500',
}

function Progress({
  value = 0,
  max = 100,
  className,
  trackClassName,
  showLabel = false,
  size = 'md',
  color = 'indigo',
  animated = true,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs font-medium text-slate-300">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-800/80 rounded-full overflow-hidden',
          sizeMap[size],
          trackClassName
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            colorMap[color],
            animated && 'transition-all duration-700 ease-out',
            pct > 0 && pct < 100 && 'relative overflow-hidden',
          )}
          style={{ width: `${pct}%` }}
        >
          {pct > 0 && pct < 100 && (
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                translate-x-[-100%] animate-[shimmer_2s_infinite]"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export { Progress }