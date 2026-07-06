'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { WorkPulseLogo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

const STEPS = [
  { path: '/onboarding/workspace', label: 'Workspace' },
  { path: '/onboarding/structure', label: 'Structure' },
  { path: '/onboarding/invite', label: 'Team' },
  { path: '/onboarding/complete', label: 'Done' },
]

export function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex(s => pathname === s.path)
  const progress = ((currentIndex + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <WorkPulseLogo />
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            {STEPS.map((step, i) => (
              <span
                key={step.path}
                className={cn(
                  'font-medium transition-colors',
                  i <= currentIndex ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                )}
              >
                {step.label}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}