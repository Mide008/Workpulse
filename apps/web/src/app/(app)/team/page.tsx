// apps/web/src/app/(app)/team/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamClient from './team-client'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  // Fetch active members
  const { data: members } = await supabase
    .from('users')
    .select('*, role:roles(id, name, level)')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)

  // Fetch tasks for the progress bars
  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('assigned_to, status')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)

  // Fetch roles for the invite dropdown
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('workspace_id', user.workspaceId)
    .order('level')

  // Fetch pending invites
  const { data: pendingInvites } = await (supabase as any)
    .from('invitations')
    .select('*, role:roles(name)')
    .eq('workspace_id', user.workspaceId)
    .eq('status', 'pending')

  return (
    <TeamClient 
      members={members ?? []} 
      taskCounts={taskCounts ?? []} 
      currentUser={user} 
      roles={roles ?? []} 
      pendingInvites={pendingInvites ?? []}
    />
  )
}
