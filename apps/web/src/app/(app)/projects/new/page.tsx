export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import NewProjectClient from './new-project-client'

export const metadata = { title: 'New Project' }

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, job_title')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)
    .order('full_name')

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('workspace_id', user.workspaceId)
    .order('name')

  return (
    <NewProjectClient
      members={(members as any[]) ?? []}
      teams={(teams as any[]) ?? []}
      currentUserId={user.id}
    />
  )
}