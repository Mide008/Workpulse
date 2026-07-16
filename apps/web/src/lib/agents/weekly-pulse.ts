// apps/web/src/lib/agents/weekly-pulse.ts
import { getServiceClient, callAI, createNotification, logAgentRun } from './agent-base'

export async function runWeeklyPulseAgent() {
  const supabase = getServiceClient()

  const { data: workspaces } = await supabase.from('workspaces').select('id, name')
  if (!workspaces?.length) return

  const now = new Date()
  const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(now.getDate() - 14)

  for (const workspace of workspaces) {
    try {
      const { data: members } = await supabase
        .from('users')
        .select('id, full_name, role:roles!users_role_id_fkey(level, name)')
        .eq('workspace_id', workspace.id)
        .eq('is_active', true)

      if (!members?.length) continue

      for (const member of members) {
        const m = member as any

        // This week's tasks
        const { data: thisWeekTasks } = await supabase
          .from('tasks')
          .select('id, status, priority, completed_at, due_date')
          .eq('workspace_id', workspace.id)
          .eq('assigned_to', member.id)
          .gte('created_at', weekAgo.toISOString())
          .is('deleted_at', null)

        // Last week's tasks for comparison
        const { data: lastWeekTasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('workspace_id', workspace.id)
          .eq('assigned_to', member.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString())
          .is('deleted_at', null)

        const thisWeek = thisWeekTasks ?? []
        const lastWeek = lastWeekTasks ?? []

        const thisWeekDone = thisWeek.filter(t => t.status === 'done').length
        const lastWeekDone = lastWeek.filter(t => t.status === 'done').length
        const thisWeekRate = thisWeek.length > 0 ? Math.round((thisWeekDone / thisWeek.length) * 100) : 0
        const lastWeekRate = lastWeek.length > 0 ? Math.round((lastWeekDone / lastWeek.length) * 100) : 0
        const trend = thisWeekRate - lastWeekRate

        const prompt = `Write a 2-sentence Friday performance note for ${m.full_name} (${m.role?.name ?? 'team member'}).

This week: ${thisWeekDone} tasks completed out of ${thisWeek.length} (${thisWeekRate}% rate)
Last week: ${lastWeekDone} completed out of ${lastWeek.length} (${lastWeekRate}% rate)
Trend: ${trend > 0 ? `+${trend}%` : `${trend}%`}

${trend >= 0 ? 'Write an encouraging note that acknowledges their progress and motivates continued momentum.' : 'Write a supportive coaching note that acknowledges the week and gives one specific practical suggestion to improve next week.'}
Keep it human, not corporate. No greetings or sign-offs.`

        const message = await callAI(prompt, 120)
        if (!message) continue

        const emoji = trend > 5 ? '🚀' : trend >= 0 ? '✅' : '💪'
        await createNotification(supabase, {
          workspaceId: workspace.id,
          userId: member.id,
          title: `${emoji} Your weekly pulse — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
          message,
          type: 'info',
          link: '/dashboard',
          source: 'agent',
        })
      }

      await logAgentRun(supabase, workspace.id, 'weekly_pulse', 'success', {
        membersNotified: members.length,
      })
    } catch (err: any) {
      console.error(`[weekly-pulse] workspace ${workspace.id}:`, err?.message)
      await logAgentRun(supabase, workspace.id, 'weekly_pulse', 'error', null, err?.message)
    }
  }
}