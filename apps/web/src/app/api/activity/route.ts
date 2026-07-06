// apps/web/src/app/api/activity/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 20)

  const { data, error } = await (supabase as any)
    .from('activity_logs')
    .select('*, user:users!activity_logs_user_id_fkey(id, full_name, avatar_url)')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ activity: data ?? [] })
})