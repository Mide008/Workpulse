import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  progress: z.number().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  blockerReason: z.string().nullable().optional(),
  blockerCategory: z.string().nullable().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url, email, job_title),
      creator:users!tasks_created_by_fkey(id, full_name, avatar_url),
      project:projects(id, name, color),
      comments(
        id, content, created_at, is_edited,
        author:users!comments_user_id_fkey(id, full_name, avatar_url)
      ),
      attachments(
        id, file_name, file_url, file_size, file_type, created_at,
        uploader:users!attachments_uploaded_by_fkey(id, full_name)
      ),
      task_activities(
        id, action, old_value, new_value, created_at,
        actor:users!task_activities_user_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true, referencedTable: 'comments' })
    .order('created_at', { ascending: false, referencedTable: 'task_activities' })
    .single()

  if (error || !task) {
    return Response.json({ error: 'Task not found' }, { status: 404 })
  }

  return Response.json({ task })
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const d = parsed.data

  const { data: current } = await supabase
    .from('tasks')
    .select('status, priority, assigned_to, title')
    .eq('id', id!)
    .single()

  const updates: Record<string, any> = {}
  if (d.title !== undefined) updates.title = d.title
  if (d.description !== undefined) updates.description = d.description
  if (d.status !== undefined) {
    updates.status = d.status
    if (d.status === 'done') updates.completed_at = new Date().toISOString()
    else updates.completed_at = null
    if (d.status === 'done') updates.progress = 100
    if (d.status === 'not_started') updates.progress = 0
  }
  if (d.priority !== undefined) updates.priority = d.priority
  if (d.progress !== undefined) updates.progress = d.progress
  if (d.assignedTo !== undefined) updates.assigned_to = d.assignedTo
  if (d.dueDate !== undefined) updates.due_date = d.dueDate
  if (d.estimatedHours !== undefined) updates.estimated_hours = d.estimatedHours
  if (d.actualHours !== undefined) updates.actual_hours = d.actualHours
  if (d.blockerReason !== undefined) updates.blocker_reason = d.blockerReason
  if (d.blockerCategory !== undefined) updates.blocker_category = d.blockerCategory
  if (d.category !== undefined) updates.category = d.category
  if (d.tags !== undefined) updates.tags = d.tags

  // Cast the entire update chain to any
  const { data: task, error } = await (supabase
    .from('tasks') as any)
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('id, title, status, priority, progress, updated_at')
    .single()

  if (error) throw error

  // Activity log – cast to any
  await (supabase.from('task_activities') as any).insert({
    task_id: id,
    user_id: ctx.userId,
    action: 'updated',
    old_value: current,
    new_value: updates,
  })

  return Response.json({ task })
})

export const DELETE = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const supabase = await createServerSupabaseClient()

    // Cast to any for deleted_at
    const { error } = await (supabase
      .from('tasks') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error

    return Response.json({ success: true })
  },
  { permission: 'delete_tasks' }
)