// apps/web/src/app/(app)/settings/billing/billing-client.tsx
'use client'

import { motion } from 'framer-motion'
import { Check, Zap, Building2, Users, FolderKanban, CheckSquare, Crown, ArrowRight, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN_PRICING, PLAN_LIMITS } from '@/lib/plans'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'

interface Props {
  workspace: {
    id: string
    name: string
    plan: string
    plan_seats: number | null
    plan_expires_at: string | null
    billing_email: string | null
  }
  usage: { members: number; tasks: number; projects: number }
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    'Up to 5 team members',
    '3 active projects',
    'Task management and Kanban board',
    'Team chat',
    'Goal tracking',
    'Basic email support',
  ],
  pro: [
    'Up to 25 team members',
    'Unlimited projects',
    'Full KPI scoring engine',
    'AI performance insights',
    'Advanced analytics and reporting',
    'PDF report export and sharing',
    'CRM (contacts, deals, pipeline)',
    'Task templates and recurring tasks',
    'Custom brand colour',
    'Priority support',
  ],
  enterprise: [
    'Unlimited team members',
    'Unlimited everything',
    'All Pro features',
    'Dedicated account manager',
    'Custom onboarding',
    'SSO and advanced permissions',
    'SLA guarantee',
    'API access',
    'Custom contract and invoicing',
  ],
}

export default function BillingClient({ workspace, usage }: Props) {
  const currentPlan = (workspace.plan ?? 'free') as 'free' | 'pro' | 'enterprise'
  const limits = PLAN_LIMITS[currentPlan]

  function contactSales() {
    window.location.href = 'mailto:hello@workpulse.io?subject=WorkPulse Enterprise Enquiry'
  }

  function startUpgrade(plan: string) {
    toast.info('Payment integration coming soon. Contact us at hello@workpulse.io to upgrade manually.')
  }

  const usageItems = [
    { label: 'Team members', used: usage.members, limit: typeof limits.seats === 'number' ? limits.seats : null, icon: Users },
    { label: 'Active projects', used: usage.projects, limit: typeof limits.projects === 'number' ? limits.projects : null, icon: FolderKanban },
    { label: 'Tasks created', used: usage.tasks, limit: null, icon: CheckSquare },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Billing & Plan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage your subscription and view usage</p>
      </motion.div>

      {/* Current plan */}
      <motion.div variants={staggerItem}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current plan</p>
            </div>
            <h2 className="text-2xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
              {currentPlan} Plan
            </h2>
            {currentPlan === 'free' && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Free forever with core features. Upgrade to unlock analytics, CRM, and unlimited team members.
              </p>
            )}
            {currentPlan === 'pro' && workspace.plan_expires_at && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Renews {new Date(workspace.plan_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {currentPlan === 'free' ? '$0' : currentPlan === 'pro' ? '$12' : 'Custom'}
              {currentPlan !== 'enterprise' && <span className="text-base font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/user/mo</span>}
            </p>
          </div>
        </div>

        {/* Usage */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          {usageItems.map(item => {
            const pct = item.limit ? (item.used / item.limit) * 100 : null
            const nearLimit = pct !== null && pct >= 80
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <span className={cn('text-xs font-bold', nearLimit && 'text-amber-500')}
                    style={!nearLimit ? { color: 'var(--text-primary)' } : undefined}>
                    {item.used}{item.limit ? ` / ${item.limit}` : ''}
                  </span>
                </div>
                {item.limit && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct!, 100)}%`,
                        background: nearLimit ? '#F59E0B' : 'var(--primary)',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Plan cards */}
      <motion.div variants={staggerItem}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {currentPlan === 'free' ? 'Upgrade your plan' : 'Available plans'}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {(['free', 'pro', 'enterprise'] as const).map(plan => {
            const pricing = PLAN_PRICING[plan]
            const isCurrent = plan === currentPlan
            const isRecommended = plan === 'pro'

            return (
              <div
                key={plan}
                className={cn(
                  'relative rounded-2xl border p-5 flex flex-col',
                  isRecommended && 'ring-2'
                )}
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: isRecommended ? 'var(--primary)' : 'var(--border)',
                  ...(isRecommended ? { '--tw-ring-color': 'var(--primary)' } as any : {}),
                }}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'var(--primary)' }}>
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm font-semibold capitalize mb-1" style={{ color: 'var(--text-primary)' }}>
                    {pricing.label}
                  </p>
                  <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {plan === 'enterprise' ? 'Custom' : plan === 'free' ? '$0' : `$${pricing.monthly}`}
                    {plan === 'pro' && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/user/mo</span>}
                  </p>
                  {plan === 'pro' && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      or ${pricing.annual}/user/mo billed annually
                    </p>
                  )}
                </div>

                <div className="flex-1 space-y-2 mb-5">
                  {PLAN_FEATURES[plan].map(feat => (
                    <div key={feat} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    Current plan
                  </div>
                ) : plan === 'enterprise' ? (
                  <button onClick={contactSales}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border transition hover:opacity-80"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    Contact sales
                  </button>
                ) : (
                  <button
                    onClick={() => startUpgrade(plan)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--primary)' }}
                  >
                    {plan === 'pro' ? 'Upgrade to Pro' : 'Get started'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={staggerItem}
        className="rounded-2xl border p-5 flex items-center gap-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
          <Mail className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Need a custom plan?</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Large teams, public sector, NGOs, or custom requirements. We'll sort you out.
          </p>
        </div>
        <a href="mailto:hello@workpulse.io?subject=WorkPulse Custom Plan"
          className="text-sm font-semibold px-4 py-2.5 rounded-xl border transition hover:opacity-80 shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          Get in touch
        </a>
      </motion.div>
    </motion.div>
  )
}