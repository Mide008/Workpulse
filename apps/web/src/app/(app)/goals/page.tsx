import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import GoalsClient from './goals-client'

export const metadata = { title: 'Goals' }

export default async function GoalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      user:users!goals_user_id_fkey(id, full_name, avatar_url),
      setter:users!goals_set_by_fkey(id, full_name)
    `)
    .eq('workspace_id', user.workspaceId)
    .order('created_at', { ascending: false })

  const { data: members } = user.roleLevel <= 2
    ? await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('workspace_id', user.workspaceId)
        .eq('is_active', true)
    : { data: [] }

  return (
    <GoalsClient
      initialGoals={(goals as any[]) ?? []}
      members={(members as any[]) ?? []}
      currentUser={user}
    />
  )
}