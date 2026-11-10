// apps/web/src/lib/api-guard.ts
import { effectivePlan } from '@/lib/plans'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission, canUsePlanFeature } from '@/lib/permissions'
import type { Permission, Plan } from '@/lib/permissions'
import type { NextRequest } from 'next/server'

export interface AuthContext {
  userId: string
  workspaceId: string
  roleLevel: number
  plan: Plan
  userFullName: string
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('workspace_id, full_name, role:roles(level), workspace:workspaces(plan, plan_expires_at)')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  const p = profile as any

  return {
    userId: user.id,
    workspaceId: p.workspace_id,
    roleLevel: p.role?.level ?? 4,
    plan: effectivePlan(p.workspace?.plan, p.workspace?.plan_expires_at) as Plan,
    userFullName: p.full_name ?? user.email?.split('@')[0] ?? 'User',
  }
}

export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<Response>,
  options?: { permission?: Permission; feature?: string }
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const ctx = await getAuthContext(req)
      if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
      if (options?.permission && !hasPermission(ctx.roleLevel, options.permission)) return Response.json({ error: 'Forbidden' }, { status: 403 })
      if (options?.feature && !canUsePlanFeature(ctx.plan, options.feature)) return Response.json({ error: 'plan_upgrade_required', feature: options.feature }, { status: 402 })
      return await handler(req, ctx)
    } catch (err) {
      console.error('[API Error]', err)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}