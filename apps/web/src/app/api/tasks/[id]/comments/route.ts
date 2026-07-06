// apps/web/src/app/api/tasks/[id]/comments/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const schema = z.object({
  content: z.string().min(1).max(5000),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const segments = req.nextUrl.pathname.split('/')
  const taskId = segments[segments.indexOf('tasks') + 1]

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  // Get task title and assignee for activity logging
  const { data: task } = await supabase
    .from('tasks')
    .select('title, assigned_to')
    .eq('id', taskId!)
    .single()

  // Insert into the task_comments table – cast supabase to any because the table may not be in generated types
  const { data: comment, error } = await (supabase as any)
    .from('task_comments')
    .insert({
      workspace_id: ctx.workspaceId,
      task_id: taskId,
      user_id: ctx.userId,
      content: parsed.data.content,
    })
    .select('id, content, created_at, is_edited, user:users!task_comments_user_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) throw error

  // Log activity
  const notifyUsers: string[] = []
  if ((task as any)?.assigned_to && (task as any).assigned_to !== ctx.userId) {
    notifyUsers.push((task as any).assigned_to)
  }

  await logActivity({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    entityType: 'task',
    entityId: taskId!,
    entityTitle: (task as any)?.title ?? 'Task',
    action: 'task_commented',
    metadata: { commentId: (comment as any).id, actorName: ctx.userFullName },
    notifyUserIds: notifyUsers,
  })

  return Response.json({ comment }, { status: 201 })
})