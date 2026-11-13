// apps/web/src/app/(app)/settings/billing/billing-client.tsx
'use client'

import { motion } from 'framer-motion'
import { Check, Users, FolderKanban, CheckSquare, Crown, ArrowRight, Mail, Receipt, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN_PRICING, PLAN_LIMITS } from '@/lib/plans'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { format } from 'date-fns'

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
  payments: any[]
  payEnabled: boolean
  chargeCurrency: string
  usdRate: number
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
    'HR module (leave, appraisals)',
    'Approvals workflow',
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

export default function BillingClient({ workspace, usage, payments }: Props) {
  const currentPlan = (workspace.plan ?? 'free') as 'free' | 'pro' | 'enterprise'
  const limits = PLAN_LIMITS[currentPlan]
  const expiresAt = workspace.plan_expires_at ? new Date(workspace.plan_expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false

  function contactSales() {
    window.location.href = 'mailto:hello@workpulse.io?subject=WorkPulse Enterprise Enquiry'
  }

  const usageItems = [
    { label: 'Team members', used: usage.members, limit: typeof limits.seats === 'number' && limits.seats < 9999 ? limits.seats : null, icon: Users },
    { label: 'Active projects', used: usage.projects, limit: typeof limits.projects === 'number' && limits.projects < 9999 ? limits.projects : null, icon: FolderKanban },
    { label: 'Tasks created', used: usage.tasks, limit: null, icon: CheckSquare },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Billing & Plan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage your subscription and view usage</p>
      </motion.div>

      {isExpired && (
        <motion.div variants={staggerItem} role="alert" className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Pro plan expired</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>The workspace is back on Starter limits. Contact us to renew.</p>
          </div>
        </motion.div>
      )}

      {/* Current plan card */}
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
                Free forever with core features. Upgrade to unlock analytics, CRM, HR, and unlimited team members.
              </p>
            )}
            {currentPlan === 'pro' && expiresAt && !isExpired && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Renews {format(expiresAt, 'd MMMM yyyy')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {currentPlan === 'free' ? '$0' : currentPlan === 'pro' ? `$${PLAN_PRICING.pro.monthly}` : 'Custom'}
              {currentPlan !== 'enterprise' && <span className="text-base font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/user/mo</span>}
            </p>
          </div>
        </div>

        {/* Usage meters */}
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
                  <a
                    href={`mailto:hello@workpulse.io?subject=Upgrade to Pro&body=Please upgrade ${workspace.name} to the Pro plan.`}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--primary)' }}
                  >
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Payment history */}
      <motion.div variants={staggerItem} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Receipt className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Payment history</h2>
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No payments yet.</p>
        ) : (
          <ul>
            {payments.map((p: any) => (
              <li key={p.id} className="px-5 py-3.5 flex items-center gap-3 border-b last:border-0 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Pro · {p.seats} seat{p.seats !== 1 ? 's' : ''} · {p.interval}
                  </p>
                  <p className="text-xs break-all" style={{ color: 'var(--text-muted)' }}>
                    {p.paid_at ? format(new Date(p.paid_at), 'd MMM yyyy') : ''} · {p.reference}
                  </p>
                </div>
                <p className="text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {Number(p.amount).toLocaleString()} {p.currency}
                </p>
              </li>
            ))}
          </ul>
        )}
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