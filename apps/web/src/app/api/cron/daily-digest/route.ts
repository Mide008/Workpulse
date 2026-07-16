// apps/web/src/app/api/cron/daily-digest/route.ts
export const dynamic = 'force-dynamic'
export const cron = '0 7 * * *'  // Runs every day at 7am

import { NextRequest } from 'next/server'
import { getServiceClient, callAI, createNotification, logAgentRun } from '@/lib/agents/agent-base'

export async function GET(req: NextRequest) {
  // Verify cron secret (optional but recommended)
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Your cron logic here
    // Fetch workspace, run AI, send notifications, etc.
    return Response.json({ success: true, message: 'Daily digest sent' })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}