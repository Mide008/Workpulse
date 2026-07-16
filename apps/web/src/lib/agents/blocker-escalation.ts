// apps/web/src/lib/agents/blocker-escalation.ts
import { getServiceClient, callAI, createNotification, logAgentRun } from './agent-base'

export async function runBlockerEscalationAgent() {
  const supabase = getServiceClient()

  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 48)

  // Get all blocked tasks older than 48 hours
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select(`
      id, title, blocker_reason, blocker_category, workspace_id,
      assigned_to, created_at,
      assignee:users!tasks_assigned_to_fkey(id, full_name, workspace_id),
      workspace:workspaces!tasks_workspace_id_fkey(id, name)
    `)
    .eq('status', 'blocked')
    .lt('updated_at', cutoff.toISOString())
    .is('deleted_at', null)

  if (!blockedTasks?.length) return

  for (const task of blockedTasks) {
    try {
      const t = task as any

      // Find the manager for the assigned user
      const { data: assigneeProfile } = await supabase
        .from('users')
        .select('role:roles!users_role_id_fkey(level)')
        .eq('id', t.assigned_to)
        .single()

      const assigneeLevel = (assigneeProfile as any)?.role?.level ?? 4

      // Find all users at a higher level in the workspace
      const { data: managers } = await supabase
        .from('users')
        .select('id, full_name, role:roles!users_role_id_fkey(level)')
        .eq('workspace_id', t.workspace_id)
        .eq('is_active', true)

      const directManagers = (managers ?? []).filter(m =>
        (m.role as any)?.level < assigneeLevel && (m.role as any)?.level <= 2
      )

      if (!directManagers.length) continue

      // Check if we already notified about this task in the last 24h
      const { data: recentAlert } = await supabase
        .from('notifications')
        .select('id')
        .eq('entity_id', t.id)
        .eq('source', 'agent')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle()

      if (recentAlert) continue

      const blockedHours = Math.round((Date.now() - new Date(t.updated_at ?? t.created_at).getTime()) / 3600000)

      const prompt = `Task "${t.title}" has been blocked for ${blockedHours} hours.
Blocker category: ${t.blocker_category ?? 'Unspecified'}
Blocker reason: ${t.blocker_reason ?? 'No reason provided'}

Write 3 concise resolution suggestions (one sentence each, numbered) that a manager could action immediately. Be specific to the blocker type.`

      const suggestions = await callAI(prompt, 200)

      const title = `Blocker escalation: "${t.title}" (${blockedHours}h blocked)`
      const message = suggestions || `Task blocked for ${blockedHours}h. Reason: ${t.blocker_reason ?? 'Not specified'}. Assigned to ${t.assignee?.full_name ?? 'Unknown'}.`

      for (const manager of directManagers) {
        await createNotification(supabase, {
          workspaceId: t.workspace_id,
          userId: manager.id,
          title,
          message,
          type: 'warning',
          link: `/tasks/${t.id}`,
          source: 'agent',
          actionUrl: `/tasks/${t.id}`,
        })
      }

      await logAgentRun(supabase, t.workspace_id, 'blocker_escalation', 'success', {
        taskId: t.id,
        taskTitle: t.title,
        blockedHours,
        managersNotified: directManagers.length,
      })
    } catch (err: any) {
      console.error(`[blocker-escalation] task ${task.id}:`, err?.message)
    }
  }
}