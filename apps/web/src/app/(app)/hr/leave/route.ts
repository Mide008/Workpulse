// apps/web/src/app/(app)/hr/leave/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)
    .from('leave_requests')
    .select('*, user:users!leave_requests_user_id_fkey(id, full_name, avatar_url)')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
  return Response.json({ leaveRequests: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const supabase = await createServerSupabaseClient()
  const { data: leave, error } = await (supabase as any)
    .from('leave_requests')
    .insert({
      workspace_id: ctx.workspaceId,
      user_id: ctx.userId,
      type: body.type,
      start_date: body.startDate,
      end_date: body.endDate,
      days_requested: body.daysRequested,
      reason: body.reason ?? null,
      status: 'pending',
    })
    .select('*, user:users!leave_requests_user_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ leave }, { status: 201 })
})