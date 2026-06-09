// apps/web/src/components/ui/button.tsx

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2',
}

const variantClasses: Record<Exclude<ButtonVariant, 'primary'>, string> = {
  secondary: 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)]',
  ghost: 'hover:bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger: 'bg-red-500/10 hover:bg-red-500/15 text-red-500 border border-red-500/20',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none'

  const operationalStyle = variant === 'primary'
    ? {
        background: 'var(--primary, #6366F1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        color: 'white',
        ...style,
      }
    : style

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        base,
        variant !== 'primary' && variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={operationalStyle}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

export type { ButtonProps }
export default Button