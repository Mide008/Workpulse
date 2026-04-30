import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(
  async (req: NextRequest, ctx) => {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') ?? ctx.userId
    const period = searchParams.get('period') ?? 'month'

    const supabase = await createServerSupabaseClient()

    const now = new Date()
    const periodStart = new Date()
    if (period === 'week') periodStart.setDate(now.getDate() - 7)
    else if (period === 'month') periodStart.setMonth(now.getMonth() - 1)
    else if (period === 'quarter') periodStart.setMonth(now.getMonth() - 3)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, priority, due_date, completed_at, created_at, progress')
      .eq('assigned_to', userId)
      .eq('workspace_id', ctx.workspaceId)
      .is('deleted_at', null)
      .gte('created_at', periodStart.toISOString())

    if (!tasks || tasks.length === 0) {
      return Response.json({
        kpi: {
          totalTasks: 0, completedTasks: 0, overdueTasks: 0, blockedTasks: 0,
          completionRate: 0, onTimeRate: 0, priorityScore: 0,
          activityScore: 0, overallScore: 0,
          period, periodStart: periodStart.toISOString(), periodEnd: now.toISOString(),
        },
      })
    }

    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'done'
    ).length
    const blocked = tasks.filter(t => t.status === 'blocked').length

    // Completion rate (0-100)
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // On-time rate: completed tasks that were done before or on due date
    const tasksWithDue = tasks.filter(t => t.due_date && t.status === 'done' && t.completed_at)
    const onTime = tasksWithDue.filter(t =>
      new Date(t.completed_at!) <= new Date(t.due_date!)
    ).length
    const onTimeRate = tasksWithDue.length > 0
      ? Math.round((onTime / tasksWithDue.length) * 100)
      : completionRate

    // Priority score: weight by priority
    const WEIGHTS: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    const completedWeighted = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (WEIGHTS[t.priority] ?? 1), 0)
    const totalWeighted = tasks.reduce((sum, t) => sum + (WEIGHTS[t.priority] ?? 1), 0)
    const priorityScore = totalWeighted > 0
      ? Math.round((completedWeighted / totalWeighted) * 100)
      : 0

    // Activity score: tasks logged per week normalised to 100
    const weeksInPeriod = Math.max(1, Math.round(
      (now.getTime() - periodStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ))
    const tasksPerWeek = total / weeksInPeriod
    const activityScore = Math.min(100, Math.round((tasksPerWeek / 5) * 100))

    // Overall: weighted composite
    const overallScore = Math.round(
      completionRate * 0.35 +
      onTimeRate * 0.30 +
      priorityScore * 0.20 +
      activityScore * 0.15
    )

    const kpi = {
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      blockedTasks: blocked,
      completionRate,
      onTimeRate,
      priorityScore,
      activityScore,
      overallScore,
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
    }

    // Cache KPI snapshot
    await supabase.from('kpi_snapshots').upsert({
      workspace_id: ctx.workspaceId,
      user_id: userId,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
      total_tasks: total,
      completed_tasks: completed,
      overdue_tasks: overdue,
      blocked_tasks: blocked,
      completion_rate: completionRate,
      on_time_rate: onTimeRate,
      priority_score: priorityScore,
      activity_score: activityScore,
      overall_score: overallScore,
    }, { onConflict: 'user_id,period_start,period_end' })

    return Response.json({ kpi })
  },
  { permission: 'view_own_kpis' }
)