// apps/web/src/app/api/reports/share/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/plans'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  if (!canAccess(ctx.plan as any, 'reportSharing')) {
    return Response.json({ error: 'Report sharing requires Pro plan' }, { status: 403 })
  }

  const body = await req.json()
  const { title, period, snapshot } = body
  const supabase = await createServerSupabaseClient()

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Cast supabase to any to bypass type checks for shared_reports
  const { data: report, error } = await (supabase as any)
    .from('shared_reports')
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      title: title || `Performance Report — ${period}`,
      period,
      snapshot,
      expires_at: expiresAt,
    })
    .select('id, token, title, expires_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'
  const shareUrl = `${appUrl}/reports/${(report as any).token}`

  return Response.json({ report, shareUrl }, { status: 201 })
})

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)
    .from('shared_reports')
    .select('id, token, title, period, created_at, expires_at')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
    .limit(20)
  return Response.json({ reports: data ?? [] })
})