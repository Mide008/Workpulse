import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  className?: string
  inputClassName?: string
  id?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  value?: string
  defaultValue?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  autoComplete?: string
  autoFocus?: boolean
  name?: string
  required?: boolean
  [key: string]: any
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, inputClassName, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl text-[var(--text-primary)] text-sm',
              'placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
              'hover:border-[var(--border)]20 transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'py-2.5',
              icon ? 'pl-10' : 'pl-4',
              iconRight ? 'pr-10' : 'pr-4',
              error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
              inputClassName
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }