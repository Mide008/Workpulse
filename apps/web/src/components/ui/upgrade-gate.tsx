// apps/web/src/components/ui/upgrade-gate.tsx
import Link from 'next/link'
import { Crown, ArrowRight } from 'lucide-react'

interface UpgradeGateProps {
  feature: string
  description: string
}

export default function UpgradeGate({ feature, description }: UpgradeGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
        <Crown className="w-8 h-8" style={{ color: 'var(--primary)' }} />
      </div>
      <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {feature} requires Pro
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
      <Link
        href="/settings/billing"
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
        style={{ background: 'var(--primary)' }}
      >
        View upgrade options
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}