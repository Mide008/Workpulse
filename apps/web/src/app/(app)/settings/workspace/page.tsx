import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import WorkspaceSettingsClient from './workspace-settings-client'

export const metadata = { title: 'Workspace Settings' }

export default async function WorkspaceSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 1) redirect('/settings/profile')

  const supabase = await createServerSupabaseClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', user.workspaceId)
    .single()

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('workspace_id', user.workspaceId)
    .order('level')

  return (
    <WorkspaceSettingsClient
      workspace={workspace as any}
      roles={(roles as any[]) ?? []}
      currentUser={user}
    />
  )
}