// apps/web/src/app/api/tasks/route.ts
import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'review', 'done']).default('not_started'),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const assignedTo = searchParams.get('assignedTo')
  const projectId = searchParams.get('projectId')
  const search = searchParams.get('search')

  let query = supabase
    .from('tasks')
    .select(`
      id, title, status, priority, progress,
      due_date, estimated_hours, category, tags,
      blocker_reason, created_at, updated_at,
      assigned_to, project_id, position,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
      project:projects(id, name, color)
    `)
    .eq('workspace_id', ctx.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (projectId) query = query.eq('project_id', projectId)
  if (search) query = query.ilike('title', `%${search}%`)

  // Role‑based access: users above level 2 can only see their own tasks
  if (ctx.roleLevel > 2) {
    query = query.eq('assigned_to', ctx.userId)
  }

  const { data, error } = await query
  if (error) throw error

  return Response.json({ tasks: data })
})

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const d = parsed.data

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: ctx.workspaceId,
        created_by: ctx.userId,
        title: d.title,
        description: d.description,
        project_id: d.projectId,
        assigned_to: d.assignedTo ?? ctx.userId,
        priority: d.priority,
        status: d.status,
        due_date: d.dueDate,
        estimated_hours: d.estimatedHours,
        category: d.category,
        tags: d.tags ?? [],
      })
      .select('id, title, status, priority, created_at, assigned_to')
      .single()

    if (error) throw error

    // Log activity using the centralized logger (replaces the raw insert)
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'task',
      entityId: (task as any).id,
      entityTitle: (task as any).title,
      action: 'task_created',
      metadata: {
        priority: d.priority,
        status: d.status,
        actorName: ctx.userFullName,
      },
      // Notify the assigned user if different from creator
      notifyUserIds: d.assignedTo && d.assignedTo !== ctx.userId ? [d.assignedTo] : [],
    })

    // Also log a separate assignment activity if the task is assigned to someone else
    if (d.assignedTo && d.assignedTo !== ctx.userId) {
      await logActivity({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        entityType: 'task',
        entityId: (task as any).id,
        entityTitle: (task as any).title,
        action: 'task_assigned',
        metadata: {
          assignedTo: d.assignedTo,
          actorName: ctx.userFullName,
        },
        notifyUserIds: [d.assignedTo],
      })
    }

    return Response.json({ task }, { status: 201 })
  },
  { permission: 'create_tasks' }
)