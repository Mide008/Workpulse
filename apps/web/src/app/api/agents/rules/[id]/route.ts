// apps/web/src/app/api/agents/rules/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()
  const { data: rule, error } = await (supabase as any)  // ← add as any
    .from('agent_rules')
    .update({ enabled: body.enabled })
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rule })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  await (supabase as any)  // ← add as any
    .from('agent_rules')
    .delete()
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
  return Response.json({ success: true })
})