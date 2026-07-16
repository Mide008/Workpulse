// apps/web/src/app/api/agents/weekly-pulse/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { runWeeklyPulseAgent } from '@/lib/agents/weekly-pulse'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await runWeeklyPulseAgent()
    return Response.json({ success: true, agent: 'weekly_pulse' })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}