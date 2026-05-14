import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import TeamClient from './team-client'

export const metadata = { title: 'Team' }

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Allow all roles to view team — managers see full detail, staff see basic view

  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('users')
    .select(`
      id, full_name, email, avatar_url, job_title, is_active, created_at,
      role:roles(id, name, level, color),
      team:teams(id, name),
      department:departments(id, name)
    `)
    .eq('workspace_id', user.workspaceId)
    .order('full_name')

  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('assigned_to, status')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)

  return (
    <TeamClient
      members={(members as any[]) ?? []}
      taskCounts={(taskCounts as any[]) ?? []}
      currentUser={user}
    />
  )
}