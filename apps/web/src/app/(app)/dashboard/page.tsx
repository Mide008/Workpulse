import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, progress')
    .eq('assigned_to', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  let teamTasks = null
  if (user.roleLevel <= 2) {
    const { data } = await supabase
      .from('tasks')
      .select('id, status, priority, assigned_to')
      .eq('workspace_id', user.workspaceId)
      .is('deleted_at', null)
    teamTasks = data
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, priority, progress, end_date, color')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  let members = null
  if (user.roleLevel <= 2) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, job_title, role:roles(name)')
      .eq('workspace_id', user.workspaceId)
      .eq('is_active', true)
      .limit(12)
    members = data
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        fullName: user.fullName,
        workspaceName: user.workspaceName,
        roleLevel: user.roleLevel,
        primaryColor: user.primaryColor,
      }}
      tasks={(tasks as any[]) ?? []}
      teamTasks={(teamTasks as any[]) ?? null}
      projects={(projects as any[]) ?? []}
      members={(members as any[]) ?? null}
    />
  )
}