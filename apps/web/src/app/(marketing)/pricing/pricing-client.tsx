'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'For small teams getting started',
    badge: null,
    features: [
      'Up to 5 users',
      '3 active projects',
      'Basic task logging',
      'Personal dashboard',
      'Email support',
      '1GB file storage',
    ],
    cta: 'Get started free',
    href: '/onboarding/workspace',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: { monthly: 12, annual: 9 },
    description: 'For growing teams that need full visibility',
    badge: 'Most popular',
    features: [
      'Unlimited users',
      'Unlimited projects',
      'KPI engine & scoring',
      'AI performance summaries',
      'Blocker digest',
      'PDF & CSV reports',
      'Goal-setting module',
      'Team & department views',
      'Real-time chat',
      'File attachments',
      '10GB file storage',
      'Priority email support',
    ],
    cta: 'Start Pro trial',
    href: '/onboarding/workspace?plan=pro',
    variant: 'primary' as const,
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'For organisations with complex needs',
    badge: null,
    features: [
      'Everything in Pro',
      'White-label (your brand)',
      'Custom domain',
      'SSO / SAML',
      'Custom roles & permissions',
      'Dedicated support',
      'SLA guarantee',
      'API access',
      'Audit logs',
      'Unlimited storage',
      'Onboarding assistance',
    ],
    cta: 'Contact sales',
    href: '/about',
    variant: 'outline' as const,
  },
]

export default function PricingClient() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-slate-400 text-lg mb-8">
              No hidden fees. No per-feature charges. Start free, scale when you're ready.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-900 border border-white/10
              rounded-2xl p-1.5">
              <button onClick={() => setAnnual(false)}
                className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  !annual ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white')}>
                Monthly
              </button>
              <button onClick={() => setAnnual(true)}
                className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                  annual ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}>
                Annual
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Save 25%
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                'relative p-8 rounded-2xl border flex flex-col',
                plan.badge
                  ? 'bg-indigo-600/10 border-indigo-500/40 shadow-2xl shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-white/[0.06]'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2
                  bg-indigo-600 text-white text-xs font-semibold px-4 py-1
                  rounded-full flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.price.monthly === null ? (
                  <div>
                    <span className="text-4xl font-bold text-white">Custom</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">
                      ${annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-slate-500">/user/month</span>
                    )}
                  </div>
                )}
                {annual && plan.price.monthly !== null && plan.price.monthly > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    Billed annually · ${(plan.price.annual ?? 0) * 12}/user/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                      plan.badge ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400')}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}
                className={cn(
                  'block text-center py-3.5 rounded-xl font-semibold text-sm transition-all',
                  plan.badge
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'border border-white/15 text-slate-300 hover:text-white hover:border-white/30'
                )}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}