// apps/web/src/lib/api-guard.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission, canUsePlanFeature } from '@/lib/permissions'
import type { Permission, Plan } from '@/lib/permissions'
import type { NextRequest } from 'next/server'

export interface AuthContext {
  userId: string
  workspaceId: string
  roleLevel: number
  plan: Plan
  userFullName: string   // <-- added
}

/**
 * Internal helper to fetch and build the auth context.
 * Used by `withAuth` and can be reused elsewhere if needed.
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('workspace_id, full_name, role:roles(level), workspace:workspaces(plan)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const p = profile as any

  return {
    userId: user.id,
    workspaceId: p.workspace_id,
    roleLevel: p.role?.level ?? 4,
    plan: (p.workspace?.plan ?? 'free') as Plan,
    userFullName: p.full_name ?? user.email?.split('@')[0] ?? 'User',
  }
}

/**
 * Higher‑order function that wraps an API route handler.
 * It checks authentication, permission, and plan features,
 * then passes an `AuthContext` (including `userFullName`) to the handler.
 */
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<Response>,
  options?: { permission?: Permission; feature?: string }
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const ctx = await getAuthContext(req)

      if (!ctx) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (options?.permission && !hasPermission(ctx.roleLevel, options.permission)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (options?.feature && !canUsePlanFeature(ctx.plan, options.feature)) {
        return Response.json(
          { error: 'plan_upgrade_required', feature: options.feature },
          { status: 402 }
        )
      }

      return await handler(req, ctx)
    } catch (err) {
      console.error('[API Error]', err)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}