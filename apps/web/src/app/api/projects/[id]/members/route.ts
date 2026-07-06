// apps/web/src/app/api/projects/[id]/members/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-2)
  const { userId } = await req.json()
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('project_members')
    .insert({
      project_id: id,
      user_id: userId,
      workspace_id: ctx.workspaceId,
    })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-2)
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('project_members')
    .delete()
    .eq('project_id', id!)
    .eq('user_id', userId!)
    .eq('workspace_id', ctx.workspaceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})