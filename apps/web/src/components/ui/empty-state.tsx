// apps/web/src/components/ui/empty-state.tsx
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border', className)}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {action && (
          action.href
            ? <Link href={action.href}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)' }}>
                {action.label}
              </Link>
            : <button onClick={action.onClick}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)' }}>
                {action.label}
              </button>
        )}
        {secondaryAction && (
          secondaryAction.href
            ? <Link href={secondaryAction.href}
                className="text-sm font-medium px-4 py-2.5 rounded-xl border transition hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {secondaryAction.label}
              </Link>
            : <button onClick={secondaryAction.onClick}
                className="text-sm font-medium px-4 py-2.5 rounded-xl border transition hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {secondaryAction.label}
              </button>
        )}
      </div>
    </div>
  )
}