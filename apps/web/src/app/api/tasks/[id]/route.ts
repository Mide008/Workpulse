// apps/web/src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  progress: z.number().min(0).max(100).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  blockerReason: z.string().nullable().optional(),
  blockerCategory: z.string().nullable().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string().uuid().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    let assignee = null
    if (task.assigned_to) {
      const { data: u } = await supabase.from('users').select('id, full_name, avatar_url, email, job_title').eq('id', task.assigned_to).single()
      assignee = u
    }

    // Cast to any to fix "task_comments" missing from generated database types
    const { data: comments } = await (supabase as any)
      .from('task_comments')
      .select('*, user:users(id, full_name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    const { data: activity } = await supabase
      .from('task_activities')
      .select('*, user:users(id, full_name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ 
      task: { ...task, assignee }, 
      comments: comments || [], 
      activity: activity || [] 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').filter(Boolean).pop()
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const d = parsed.data

  const { data: current } = await supabase.from('tasks').select('status, assigned_to').eq('id', id!).single()

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (d.title !== undefined) updates.title = d.title
  if (d.description !== undefined) updates.description = d.description
  if (d.status !== undefined) {
    let dbStatus = d.status
    if (d.status === 'To Do' || d.status === 'todo') dbStatus = 'not_started'
    if (d.status === 'In Progress') dbStatus = 'in_progress'
    if (d.status === 'Blocked') dbStatus = 'blocked'
    if (d.status === 'Done') dbStatus = 'done'
    updates.status = dbStatus
    if (dbStatus === 'done') updates.progress = 100
  }
  if (d.priority !== undefined) updates.priority = d.priority
  if (d.progress !== undefined) updates.progress = d.progress
  if (d.assignedTo !== undefined) updates.assigned_to = d.assignedTo
  if (d.dueDate !== undefined) updates.due_date = d.dueDate
  if (d.projectId !== undefined) updates.project_id = d.projectId
  if (d.blockerReason !== undefined) updates.blocker_reason = d.blockerReason

  const { data: task, error } = await (supabase.from('tasks') as any)
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select()
    .single()

  if (error) throw error

  if (updates.status && updates.status !== current?.status) {
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
      action: updates.status === 'done' ? 'task_completed' : 'task_status_changed',
      metadata: { actorName: ctx.userFullName },
    })
  }

  return Response.json({ task })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').filter(Boolean).pop()
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.from('tasks') as any).update({ deleted_at: new Date().toISOString() }).eq('id', id!).eq('workspace_id', ctx.workspaceId)
  if (error) throw error
  return Response.json({ success: true })
}, { permission: 'delete_tasks' })