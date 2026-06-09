'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// ----- Low‑level primitives (same as before) -----
function TooltipProvider({
  children,
  delayDuration = 300,
}: {
  children: React.ReactNode
  delayDuration?: number
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

// Root – used by files that already have <Tooltip><TooltipTrigger>…</TooltipContent></Tooltip>
function Tooltip({ children, ...props }: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
}

function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  return (
    <TooltipPrimitive.Trigger asChild={asChild}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  children,
  className,
  side = 'top',
}: {
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          'z-50 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]',
          'bg-[var(--bg-elevated)] border border-[var(--border)]10 rounded-lg shadow-xl',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-slate-800" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

// ----- New convenience wrapper (used in header / sidebar) -----
function SimpleTooltip({
  children,
  content,
  side = 'top',
  delayDuration = 400,
}: {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
}) {
  if (!content) return <>{children}</>
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip }