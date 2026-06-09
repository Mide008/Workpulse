export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceSettingsClient from './workspace-settings-client'

export const metadata = { title: 'Workspace Settings' }

export default async function WorkspaceSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, industry, primary_color, plan, logo_url')
    .eq('id', user.workspaceId)
    .single()

  return <WorkspaceSettingsClient workspace={workspace} user={user} />
}