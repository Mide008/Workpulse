// apps/web/src/app/(app)/team/page.tsx
export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import TeamClient from './team-client'

export const metadata = { title: 'Team' }

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

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

  // FETCH ROLES HERE
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, level')
    .eq('workspace_id', user.workspaceId)
    .order('level', { ascending: true })

  return (
    <TeamClient
      members={(members as any[]) ?? []}
      taskCounts={(taskCounts as any[]) ?? []}
      currentUser={user}
      roles={(roles as any[]) ?? []}
    />
  )
}