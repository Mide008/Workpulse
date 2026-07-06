// apps/web/src/app/api/projects/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_members(user_id, user:users!project_members_user_id_fkey(id, full_name, avatar_url))')
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ project: data })
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()

  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.status !== undefined) updates.status = body.status
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.color !== undefined) updates.color = body.color
  if (body.progress !== undefined) updates.progress = body.progress
  if (body.endDate !== undefined) updates.end_date = body.endDate
  if (body.startDate !== undefined) updates.start_date = body.startDate
  updates.updated_at = new Date().toISOString()

  // Cast to any to bypass column checks
  const { data: project, error } = await (supabase
    .from('projects') as any)
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await logActivity({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    entityType: 'project',
    entityId: id!,
    entityTitle: (project as any).name,
    action: body.status === 'completed' ? 'project_completed' : 'project_updated',
    metadata: { fields: Object.keys(updates), actorName: ctx.userFullName },
  })

  return Response.json({ project })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase
    .from('projects') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})