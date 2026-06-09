// apps/web/src/components/ui/card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

function Card({ className, children, padding = 'none', ...props }: CardProps) {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  }

  return (
    <div
      className={cn(
        'relative bg-[var(--bg-surface)]/80 border border-[var(--border)]/10 rounded-2xl backdrop-blur-sm',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.4)]',
        'transition-all duration-300',
        pads[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('flex items-center justify-between mb-5 pb-4 border-b border-[var(--border)]/10', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

function CardTitle({ className, children, icon, ...props }: CardTitleProps) {
  return (
    <h3 
      className={cn('text-[var(--text-primary)] font-semibold text-base tracking-tight flex items-center gap-2', className)}
      {...props}
    >
      {icon && <span className="text-[var(--text-secondary)] shrink-0">{icon}</span>}
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[var(--text-secondary)] text-sm mt-1', className)} {...props}>
      {children}
    </p>
  )
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[var(--border)]/10 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }