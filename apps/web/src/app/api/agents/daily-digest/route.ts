// apps/web/src/app/api/agents/daily-digest/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { runDailyDigestAgent } from '@/lib/agents/daily-digest'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await runDailyDigestAgent()
    return Response.json({ success: true, agent: 'daily_digest' })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}