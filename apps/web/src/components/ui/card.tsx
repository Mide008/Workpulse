import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <div
      className={cn(
        'relative bg-slate-900/80 border border-white/[0.06] rounded-2xl backdrop-blur-sm',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.4)]',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <h3 className={cn('text-white font-semibold text-base tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <p className={cn('text-slate-400 text-sm mt-1', className)} {...props}>
      {children}
    </p>
  )
}

function CardContent({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-white/[0.06] flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }