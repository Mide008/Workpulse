// apps/web/src/lib/integrations/slack.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

const ACTION_EMOJIS: Record<string, string> = {
  task_completed: '✅',
  task_created: '📋',
  blocker_added: '🚨',
  blocker_resolved: '🔓',
  deal_won: '🏆',
  deal_created: '💼',
  goal_completed: '🎯',
  goal_checkin: '📊',
  member_joined: '👋',
  project_created: '📁',
}

export async function notifySlack(workspaceId: string, action: string, message: string, link?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    // Cast to any to avoid type issues with workspace_integrations
    const { data: integration } = await (supabase as any)
      .from('workspace_integrations')
      .select('config, enabled')
      .eq('workspace_id', workspaceId)
      .eq('type', 'slack')
      .eq('enabled', true)
      .maybeSingle()

    if (!integration) return
    const config = integration.config as any
    if (!config?.webhook_url) return

    const allowedEvents = config.events ?? []
    if (!allowedEvents.includes(action)) return

    const emoji = ACTION_EMOJIS[action] ?? 'ℹ️'
    const payload: any = {
      text: `${emoji} *WorkPulse* — ${message}`,
    }

    if (link) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'
      payload.blocks = [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `${emoji} *WorkPulse* — ${message}` },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: 'View in WorkPulse' },
            url: `${appUrl}${link}`,
          },
        },
      ]
    }

    await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[slack] notification error:', err)
  }
}