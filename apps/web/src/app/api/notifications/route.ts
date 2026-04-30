import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read, created_at, metadata')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return Response.json({ notifications: data ?? [] })
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const body = await req.json()
  const ids: string[] = body.ids ?? []

  if (ids.length === 0) {
    // Mark all as read
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('user_id', ctx.userId)
      .eq('read', false)
  } else {
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .in('id', ids)
      .eq('user_id', ctx.userId)
  }

  return Response.json({ success: true })
})