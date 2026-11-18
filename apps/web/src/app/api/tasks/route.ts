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
  project_id: z.string().uuid().optional(), // Accepts Kanban payload
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.string().default('not_started'),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query = supabase
    .from('tasks')
    .select(`
      id, title, status, priority, progress, due_date,
      assigned_to, project_id, created_at,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
      project:projects(id, name, color)
    `)
    .eq('workspace_id', ctx.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (ctx.roleLevel > 2) query = query.eq('assigned_to', ctx.userId)

  const { data, error } = await query
  if (error) throw error
  return Response.json({ tasks: data })
})

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const d = parsed.data
    
    // Capture project_id from either camelCase or snake_case
    const finalProjectId = d.projectId || d.project_id || null

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: ctx.workspaceId,
        created_by: ctx.userId,
        title: d.title,
        description: d.description,
        project_id: finalProjectId, // Saves correctly now
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

    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
      action: 'task_created',
      metadata: { actorName: ctx.userFullName },
    })

    return Response.json({ task }, { status: 201 })
  },
  { permission: 'create_tasks' }
)