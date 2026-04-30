import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import TasksClient from './tasks-client'

export const metadata = { title: 'Tasks' }

export default async function TasksPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  let taskQuery = supabase
    .from('tasks')
    .select(`
      id, title, status, priority, progress, due_date,
      estimated_hours, category, tags, blocker_reason,
      created_at, updated_at, project_id, assigned_to,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
      project:projects(id, name, color)
    `)
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (user.roleLevel > 2) {
    taskQuery = taskQuery.eq('assigned_to', user.id)
  }

  const { data: tasks } = await taskQuery

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('name')

  const { data: members } = user.roleLevel <= 2
    ? await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('workspace_id', user.workspaceId)
        .eq('is_active', true)
    : { data: null }

  return (
    <TasksClient
      initialTasks={(tasks as any[]) ?? []}
      projects={(projects as any[]) ?? []}
      members={(members as any[]) ?? []}
      currentUser={user}
    />
  )
}