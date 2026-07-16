// apps/web/src/lib/agents/smart-assign.ts
import { getServiceClient, callAI } from './agent-base'

export async function suggestAssignee(workspaceId: string, taskTitle: string, taskPriority: string): Promise<{
  userId: string | null
  fullName: string | null
  reason: string
  scores: Array<{ userId: string; fullName: string; score: number; taskCount: number; kpiScore: number }>
}> {
  const supabase = getServiceClient()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, role:roles!users_role_id_fkey(level, name)')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  if (!members?.length) return { userId: null, fullName: null, reason: 'No team members found', scores: [] }

  const now = new Date()
  const weekEnd = new Date(); weekEnd.setDate(now.getDate() + 7)

  const memberScores = await Promise.all(
    members.map(async (member) => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, priority, due_date, completed_at')
        .eq('workspace_id', workspaceId)
        .eq('assigned_to', member.id)
        .is('deleted_at', null)

      const all = tasks ?? []
      const active = all.filter(t => !['done'].includes(t.status)).length
      const dueSoon = all.filter(t => t.due_date && new Date(t.due_date) <= weekEnd && t.status !== 'done').length
      const done = all.filter(t => t.status === 'done').length
      const completionRate = all.length > 0 ? (done / all.length) * 100 : 100

      // Lower is better (less overloaded)
      const workloadScore = 100 - Math.min(100, (active * 10) + (dueSoon * 5))
      const kpiScore = Math.round(completionRate * 0.7 + workloadScore * 0.3)

      return {
        userId: member.id,
        fullName: member.full_name,
        roleLevel: (member.role as any)?.level ?? 4,
        taskCount: active,
        dueSoon,
        completionRate: Math.round(completionRate),
        kpiScore,
        workloadScore,
      }
    })
  )

  // Filter to staff level (3-4) for task assignment, unless only managers exist
  const eligible = memberScores.filter(m => m.roleLevel >= 3).length > 0
    ? memberScores.filter(m => m.roleLevel >= 3)
    : memberScores

  const sorted = eligible.sort((a, b) => b.kpiScore - a.kpiScore)
  const top = sorted[0]

  if (!top) return { userId: null, fullName: null, reason: 'Could not determine best assignee', scores: [] }

  const prompt = `Task: "${taskTitle}" (Priority: ${taskPriority})
Best candidate: ${top.fullName}
Their stats: ${top.taskCount} active tasks, ${top.completionRate}% completion rate, ${top.dueSoon} tasks due this week.

Write one sentence explaining why they are the best choice for this task. Be specific about the data.`

  const reason = await callAI(prompt, 80) || `${top.fullName} has the best availability (${top.taskCount} active tasks) and a ${top.completionRate}% completion rate.`

  return {
    userId: top.userId,
    fullName: top.fullName,
    reason,
    scores: sorted.map(m => ({
      userId: m.userId,
      fullName: m.fullName,
      score: m.kpiScore,
      taskCount: m.taskCount,
      kpiScore: m.kpiScore,
    })),
  }
}