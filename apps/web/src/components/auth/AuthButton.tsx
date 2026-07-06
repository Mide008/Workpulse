'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export function AuthButton({
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = true,
  className,
  children,
  disabled,
  ...props
}: AuthButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]/50 active:scale-[0.98]'

  const variants = {
    primary:
      'bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    secondary:
      'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-overlay)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
  }

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}