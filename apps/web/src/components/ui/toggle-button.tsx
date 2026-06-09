import { cn } from '@/lib/utils'

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function ToggleButton({ active, onClick, children, className }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
        active ? 'text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
        className
      )}
      style={active ? { background: 'var(--primary, #6366F1)' } : undefined}
    >
      {children}
    </button>
  )
}