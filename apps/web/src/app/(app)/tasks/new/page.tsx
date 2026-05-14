export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import NewTaskClient from './new-task-client'

export const metadata = { title: 'New Task' }

export default async function NewTaskPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('name')

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, job_title')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)
    .order('full_name')

  return (
    <NewTaskClient
      projects={(projects as any[]) ?? []}
      members={(members as any[]) ?? []}
      currentUserId={user.id}
    />
  )
}