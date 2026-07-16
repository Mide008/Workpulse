// apps/web/src/lib/agents/daily-digest.ts
import { getServiceClient, callAI, createNotification, logAgentRun } from './agent-base'

export async function runDailyDigestAgent() {
  const supabase = getServiceClient()

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, primary_color')

  if (!workspaces?.length) return

  for (const workspace of workspaces) {
    try {
      const now = new Date()
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

      // Get all workspace tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, assigned_to')
        .eq('workspace_id', workspace.id)
        .is('deleted_at', null)

      const all = tasks ?? []
      const dueToday = all.filter(t =>
        t.due_date &&
        new Date(t.due_date) >= todayStart &&
        new Date(t.due_date) <= todayEnd &&
        t.status !== 'done'
      )
      const overdue = all.filter(t =>
        t.due_date &&
        new Date(t.due_date) < todayStart &&
        t.status !== 'done'
      )
      const blocked = all.filter(t => t.status === 'blocked')
      const inProgress = all.filter(t => t.status === 'in_progress')

      // Get managers and executives
      const { data: managers } = await supabase
        .from('users')
        .select('id, full_name, role:roles!users_role_id_fkey(level)')
        .eq('workspace_id', workspace.id)
        .eq('is_active', true)

      const leaders = (managers ?? []).filter(u => (u.role as any)?.level <= 2)
      if (!leaders.length) continue

      const prompt = `You are WorkPulse AI writing a daily briefing for workspace "${workspace.name}".

Today's data:
- Tasks due today: ${dueToday.length}
- Overdue tasks: ${overdue.length}
- Blocked tasks: ${blocked.length}
- Tasks in progress: ${inProgress.length}
- Total active tasks: ${all.filter(t => t.status !== 'done').length}

Write a 2-sentence morning briefing for the management team. Start with the most urgent item. Be direct and specific. No greetings, no sign-offs.`

      const summary = await callAI(prompt, 150)

      const title = `Daily Digest — ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`
      const message = summary || `${dueToday.length} task${dueToday.length !== 1 ? 's' : ''} due today · ${overdue.length} overdue · ${blocked.length} blocked.`

      for (const leader of leaders) {
        await createNotification(supabase, {
          workspaceId: workspace.id,
          userId: leader.id,
          title,
          message,
          type: overdue.length > 0 || blocked.length > 0 ? 'warning' : 'info',
          link: '/dashboard',
          source: 'agent',
          actionUrl: '/dashboard',
        })
      }

      await logAgentRun(supabase, workspace.id, 'daily_digest', 'success', {
        dueToday: dueToday.length,
        overdue: overdue.length,
        blocked: blocked.length,
        notified: leaders.length,
      })
    } catch (err: any) {
      console.error(`[daily-digest] workspace ${workspace.id}:`, err?.message)
      await logAgentRun(supabase, workspace.id, 'daily_digest', 'error', null, err?.message)
    }
  }
}