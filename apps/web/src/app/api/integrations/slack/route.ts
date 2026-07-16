// apps/web/src/app/api/integrations/slack/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { webhookUrl, events } = await req.json()
  if (!webhookUrl) return Response.json({ error: 'webhookUrl required' }, { status: 400 })

  if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
    return Response.json({ error: 'Invalid Slack webhook URL' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Test the webhook
  try {
    const testRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '🧪 WorkPulse: Slack integration test successful!' }),
    })
    if (!testRes.ok) {
      return Response.json({ error: 'Webhook URL test failed. Check that it is valid.' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Could not reach Slack webhook URL. Check network or URL.' }, { status: 400 })
  }

  // Cast supabase to any to avoid type issues with workspace_integrations
  const { error } = await (supabase as any)
    .from('workspace_integrations')
    .upsert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      type: 'slack',
      config: {
        webhook_url: webhookUrl,
        events: events ?? ['task_completed', 'blocker_added', 'deal_won', 'goal_completed'],
      },
      enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,type' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('workspace_integrations')
    .delete()
    .eq('workspace_id', ctx.workspaceId)
    .eq('type', 'slack')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})