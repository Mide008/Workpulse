// apps/web/src/app/api/integrations/webhook/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { apiKey } = await req.json()
  if (!apiKey) return Response.json({ error: 'apiKey required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  // Cast to any to avoid type issues with workspace_integrations
  const { error } = await (supabase as any)
    .from('workspace_integrations')
    .upsert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      type: 'webhook_inbound',
      config: { api_key: apiKey },
      enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,type' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase as any)
    .from('workspace_integrations')
    .select('config, enabled')
    .eq('workspace_id', ctx.workspaceId)
    .eq('type', 'webhook_inbound')
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ integration: data })
})