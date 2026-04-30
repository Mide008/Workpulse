import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Workspace tasks for managers, own tasks for staff
  let tasksQuery = supabase
    .from('tasks')
    .select('id, status, priority, due_date, completed_at, created_at, assigned_to, progress')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (user.roleLevel > 2) tasksQuery = tasksQuery.eq('assigned_to', user.id)

  const { data: tasks } = await tasksQuery

  // Team members for managers
  let members = null
  if (user.roleLevel <= 2) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('workspace_id', user.workspaceId)
      .eq('is_active', true)
    members = data
  }

  // Blocker digest
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('id, title, blocker_reason, blocker_category, created_at, assigned_to, assignee:users!tasks_assigned_to_fkey(full_name)')
    .eq('workspace_id', user.workspaceId)
    .eq('status', 'blocked')
    .is('deleted_at', null)

  return (
    <AnalyticsClient
      tasks={(tasks as any[]) ?? []}
      members={(members as any[]) ?? null}
      blockedTasks={(blockedTasks as any[]) ?? []}
      currentUser={user}
    />
  )
}