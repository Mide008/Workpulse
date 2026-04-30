import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  shimmer?: boolean
}

function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white/[0.04] relative overflow-hidden',
        shimmer && [
          'after:absolute after:inset-0',
          'after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent',
          'after:animate-[shimmer_2s_infinite]',
          'after:translate-x-[-100%]',
        ],
        className
      )}
    />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard }