// apps/web/src/components/ui/tooltip.tsx
'use client'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  children, side = 'top', className, ...props
}: {
  children: ReactNode
  side?: 'bottom' | 'left' | 'right' | 'top'
  className?: string
} & Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, 'side' | 'children' | 'className'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          'z-[100] rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow style={{ fill: 'var(--bg-elevated)' }} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export function SimpleTooltip({
  children,
  content,
  side = 'top',
  delayDuration = 200,
  disabled = false,
}: {
  children: ReactNode
  content: ReactNode
  side?: 'bottom' | 'left' | 'right' | 'top'
  delayDuration?: number
  disabled?: boolean
}) {
  // If disabled, render children with no tooltip wrapper (used when sidebar is expanded)
  if (disabled) return <>{children}</>

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  )
}