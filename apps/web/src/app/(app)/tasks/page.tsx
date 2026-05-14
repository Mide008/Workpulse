import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import TasksClient from './tasks-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tasks' }

export default async function TasksPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url), project:projects(id, name, color)')
    .eq('workspace_id', user.workspaceId)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('workspace_id', user.workspaceId)

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)

  return (
    <TasksClient
      initialTasks={(tasks as any[]) ?? []}
      projects={(projects as any[]) ?? []}
      members={(members as any[]) ?? []}
      currentUser={user}
    />
  )
}