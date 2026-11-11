// apps/web/src/components/ui/logo.tsx
import Link from 'next/link'

interface LogoProps {
  className?: string
  linkTo?: string
  size?: 'sm' | 'md' | 'lg'
  hideText?: boolean
}

const MARK = { sm: 'w-7 h-7 rounded-lg', md: 'w-8 h-8 rounded-lg', lg: 'w-12 h-12 rounded-2xl' }
const ICON = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
const TEXT = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }

export function WorkPulseLogo({ className = 'h-8 w-auto', linkTo, size = 'md', hideText = false }: LogoProps) {
  const logo = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center justify-center ${MARK[size]}`}
        style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 16px rgba(99,102,241,.35)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" className={ICON[size]} aria-hidden="true">
          <path d="M3 12h4l3-9 4 18 3-9h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!hideText && (
        <span className={`font-bold text-[var(--text-primary)] tracking-tight ${TEXT[size]}`}>WorkPulse</span>
      )}
    </div>
  )
  if (linkTo) return <Link href={linkTo} aria-label="WorkPulse home">{logo}</Link>
  return logo
}