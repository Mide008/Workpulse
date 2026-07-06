// apps/web/src/app/api/notifications/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('workspace_id', ctx.workspaceId)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return Response.json({ notifications: data ?? [] })
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const supabase = await createServerSupabaseClient()

  if (body.markAll) {
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('workspace_id', ctx.workspaceId)
      .eq('user_id', ctx.userId)
  } else if (body.id) {
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', body.id)
      .eq('user_id', ctx.userId)
  }

  return Response.json({ success: true })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  await (supabase as any)
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.userId)
  return Response.json({ success: true })
})