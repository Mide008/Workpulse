// apps/web/src/lib/agents/goal-risk.ts
import { getServiceClient, callAI, createNotification, logAgentRun } from './agent-base'

export async function runGoalRiskAgent() {
  const supabase = getServiceClient()

  const { data: goals } = await supabase
    .from('goals')
    .select(`
      id, title, target_value, current_value, due_date, workspace_id, user_id, period,
      created_at, set_by,
      user:users!goals_user_id_fkey(id, full_name, role:roles!users_role_id_fkey(level))
    `)
    .eq('status', 'active')
    .not('due_date', 'is', null)

  if (!goals?.length) return

  const now = new Date()

  for (const goal of goals) {
    try {
      const g = goal as any
      const dueDate = new Date(g.due_date)
      const createdDate = new Date(g.created_at)
      const totalDays = Math.max(1, (dueDate.getTime() - createdDate.getTime()) / 86400000)
      const elapsedDays = Math.max(0, (now.getTime() - createdDate.getTime()) / 86400000)
      const daysRemaining = Math.max(0, (dueDate.getTime() - now.getTime()) / 86400000)
      const progressPercent = ((g.current_value ?? 0) / (g.target_value ?? 100)) * 100
      const expectedProgressPercent = (elapsedDays / totalDays) * 100
      const deficit = expectedProgressPercent - progressPercent

      // Only flag if significantly behind (more than 20% deficit) with more than 7 days to go
      if (deficit < 20 || daysRemaining < 7) continue

      // Check for recent alert (don't spam weekly)
      const { data: recentAlert } = await supabase
        .from('notifications')
        .select('id')
        .contains('link', goal.id)
        .eq('source', 'agent')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle()

      if (recentAlert) continue

      // Project completion at current rate
      const dailyRate = elapsedDays > 0 ? (g.current_value ?? 0) / elapsedDays : 0
      const projectedFinal = dailyRate * totalDays
      const projectedPercent = Math.min(100, (projectedFinal / (g.target_value ?? 100)) * 100)

      const prompt = `Goal "${g.title}" is at risk.
Current progress: ${Math.round(progressPercent)}% of target
Expected by now: ${Math.round(expectedProgressPercent)}%
Deficit: ${Math.round(deficit)}% behind schedule
Days remaining: ${Math.round(daysRemaining)}
Projected completion at current rate: ${Math.round(projectedPercent)}%

Write a 2-sentence risk alert and one specific recommended action for the goal owner. Be direct.`

      const aiMessage = await callAI(prompt, 150)
      const message = aiMessage || `Goal is ${Math.round(deficit)}% behind schedule. At current rate, projected completion is ${Math.round(projectedPercent)}%.`

      // Notify goal owner
      await createNotification(supabase, {
        workspaceId: g.workspace_id,
        userId: g.user_id,
        title: `⚠️ Goal at risk: "${g.title}"`,
        message,
        type: 'warning',
        link: '/goals',
        source: 'agent',
      })

      // Notify the person who set the goal if different
      if (g.set_by && g.set_by !== g.user_id) {
        await createNotification(supabase, {
          workspaceId: g.workspace_id,
          userId: g.set_by,
          title: `⚠️ Goal at risk: "${g.title}"`,
          message,
          type: 'warning',
          link: '/goals',
          source: 'agent',
        })
      }

      await logAgentRun(supabase, g.workspace_id, 'goal_risk', 'success', {
        goalId: g.id,
        deficit: Math.round(deficit),
        daysRemaining: Math.round(daysRemaining),
        projectedPercent: Math.round(projectedPercent),
      })
    } catch (err: any) {
      console.error(`[goal-risk] goal ${goal.id}:`, err?.message)
    }
  }
}