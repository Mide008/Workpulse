// apps/web/src/app/api/agents/smart-assign/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const schema = z.object({
  taskTitle: z.string().min(1).max(500),
  taskPriority: z.string().optional(),
  taskDescription: z.string().optional(),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { taskTitle, taskPriority, taskDescription } = parsed.data
  const supabase = await createServerSupabaseClient()

  // Get all active members in the workspace with their workload
  const { data: members } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      role_level,
      tasks:assigned_tasks(
        id,
        status,
        priority,
        due_date,
        estimated_hours
      )
    `)
    .eq('workspace_id', ctx.workspaceId)
    .eq('is_active', true)

  if (!members || members.length === 0) {
    return Response.json({ error: 'No members found' }, { status: 404 })
  }

  // Calculate workload score for each member
  const scored = members.map((member: any) => {
    const tasks = member.tasks || []
    const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length
    const blocked = tasks.filter((t: any) => t.status === 'blocked').length
    const dueToday = tasks.filter((t: any) => {
      if (!t.due_date) return false
      return new Date(t.due_date).toDateString() === new Date().toDateString()
    }).length

    // Simple scoring: lower is better
    let score = inProgress * 3 + blocked * 5 + dueToday * 2

    // Boost for existing capacity (role_level 4 = staff, likely more available)
    if (member.role_level >= 4) score -= 2

    // Boost for members with no blocked tasks
    if (blocked === 0) score -= 1

    return { ...member, score }
  })

  // Sort by score (lowest = best fit)
  scored.sort((a: any, b: any) => a.score - b.score)

  // Pick the best fit
  const bestFit = scored[0]

  // Generate a reason
  let reason = `Suggested based on workload analysis.`
  if (bestFit.role_level >= 4) {
    reason = `${bestFit.full_name} has capacity and is best suited for this task based on current workload.`
  } else if (bestFit.score === 0) {
    reason = `${bestFit.full_name} has no active tasks and is available to take this on.`
  } else {
    const progress = bestFit.tasks?.filter((t: any) => t.status === 'in_progress').length || 0
    reason = `${bestFit.full_name} has ${progress} tasks in progress and has the lowest workload.`
  }

  return Response.json({
    suggestion: {
      userId: bestFit.id,
      fullName: bestFit.full_name,
      reason,
      workloadScore: bestFit.score,
    },
  })
})