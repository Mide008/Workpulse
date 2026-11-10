// apps/web/src/lib/plans.ts
export type Plan = 'free' | 'pro' | 'enterprise'

export interface PlanLimits {
  seats: number
  projects: number
  crm: boolean
  analytics: boolean
  reportSharing: boolean
  apiAccess: boolean
  customBranding: boolean
  prioritySupport: boolean
  recurringTasks: boolean
  taskTemplates: boolean
  hr: boolean
  auditExport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { seats: 5, projects: 3, crm: false, analytics: false, reportSharing: false, apiAccess: false, customBranding: false, prioritySupport: false, recurringTasks: false, taskTemplates: false, hr: false, auditExport: false },
  pro: { seats: 500, projects: 9999, crm: true, analytics: true, reportSharing: true, apiAccess: false, customBranding: true, prioritySupport: true, recurringTasks: true, taskTemplates: true, hr: true, auditExport: true },
  enterprise: { seats: 9999, projects: 9999, crm: true, analytics: true, reportSharing: true, apiAccess: true, customBranding: true, prioritySupport: true, recurringTasks: true, taskTemplates: true, hr: true, auditExport: true },
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export function canAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const value = getPlanLimits(plan)[feature]
  return typeof value === 'boolean' ? value : true
}

export const PRICE_USD = { pro: { annual: 8, monthly: 10 } } as const

export const PLAN_PRICING = {
  free: { monthly: 0, annual: 0, label: 'Starter', description: 'Up to 5 members, 3 projects' },
  pro: { monthly: PRICE_USD.pro.monthly, annual: PRICE_USD.pro.annual, label: 'Pro', description: 'Per member. Everything unlocked, no seat minimum' },
  enterprise: { monthly: 0, annual: 0, label: 'Enterprise', description: 'Custom contract, SSO, API and SLA' },
}

const GRACE_DAYS = 3
export function effectivePlan(plan: string | null | undefined, expiresAt?: string | null): Plan {
  const p = (plan ?? 'free') as Plan
  if (p === 'pro' && expiresAt && new Date(expiresAt).getTime() + GRACE_DAYS * 86400000 < Date.now()) return 'free'
  return p === 'pro' || p === 'enterprise' ? p : 'free'
}

export function seatLimit(plan: Plan, planSeats?: number | null): number {
  if (plan === 'pro') return planSeats && planSeats > 0 ? planSeats : PLAN_LIMITS.pro.seats
  return PLAN_LIMITS[plan].seats
}

export function proTotal(seats: number, interval: 'monthly' | 'annual') {
  const unit = PRICE_USD.pro[interval]
  return interval === 'annual' ? { perMonth: unit * seats, charge: unit * seats * 12, unit } : { perMonth: unit * seats, charge: unit * seats, unit }
}