import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  color: z.string().optional(),
  endDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name),
      project_members(
        role,
        user:users!project_members_user_id_fkey(id, full_name, avatar_url, job_title)
      ),
      tasks(
        id, title, status, priority, progress, due_date, assigned_to,
        assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true, referencedTable: 'tasks' })
    .single()

  if (error || !project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ project })
})

export const PATCH = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const d = parsed.data

    // Build update object directly from parsed fields
    const updates: any = {}
    if (d.name !== undefined) updates.name = d.name
    if (d.description !== undefined) updates.description = d.description
    if (d.status !== undefined) updates.status = d.status
    if (d.priority !== undefined) updates.priority = d.priority
    if (d.color !== undefined) updates.color = d.color
    if (d.endDate !== undefined) updates.end_date = d.endDate
    if (d.progress !== undefined) updates.progress = d.progress

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates as any) // cast to bypass strict typing
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)
      .select('id, name, status, progress, color')
      .single()

    if (error) throw error
    return Response.json({ project })
  },
  { permission: 'manage_projects' }
)

export const DELETE = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const supabase = await createServerSupabaseClient()

    // Soft delete: set deleted_at
    await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)

    return Response.json({ success: true })
  },
  { permission: 'manage_projects' }
)