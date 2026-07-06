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
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    seats: 5,
    projects: 3,
    crm: false,
    analytics: false,
    reportSharing: false,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    recurringTasks: false,
    taskTemplates: false,
  },
  pro: {
    seats: 25,
    projects: 50,
    crm: true,
    analytics: true,
    reportSharing: true,
    apiAccess: false,
    customBranding: true,
    prioritySupport: false,
    recurringTasks: true,
    taskTemplates: true,
  },
  enterprise: {
    seats: 999,
    projects: 999,
    crm: true,
    analytics: true,
    reportSharing: true,
    apiAccess: true,
    customBranding: true,
    prioritySupport: true,
    recurringTasks: true,
    taskTemplates: true,
  },
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export function canAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  return true
}

export const PLAN_PRICING = {
  free: { monthly: 0, annual: 0, label: 'Free', description: 'Up to 5 seats, 3 projects' },
  pro: { monthly: 12, annual: 9, label: 'Pro', description: 'Up to 25 seats, full analytics, CRM' },
  enterprise: { monthly: 0, annual: 0, label: 'Enterprise', description: 'Unlimited, custom contract' },
}