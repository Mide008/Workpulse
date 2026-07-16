// apps/web/src/app/api/agents/rules/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)  // ← add as any
    .from('agent_rules')
    .select('*')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
  return Response.json({ rules: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const supabase = await createServerSupabaseClient()
  const { data: rule, error } = await (supabase as any)  // ← add as any
    .from('agent_rules')
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      name: body.name,
      description: body.description ?? null,
      trigger_type: body.triggerType,
      trigger_config: body.triggerConfig ?? {},
      condition_config: body.conditionConfig ?? {},
      action_type: body.actionType,
      action_config: body.actionConfig ?? {},
      enabled: true,
    })
    .select('*')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rule }, { status: 201 })
})