import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import ProjectsClient from './projects-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status), project_members(user_id, user:users!project_members_user_id_fkey(id, full_name, avatar_url))')
    .eq('workspace_id', user.workspaceId)
    .order('updated_at', { ascending: false })

  return (
    <ProjectsClient
      initialProjects={(projects as any[]) ?? []}
      currentUser={user}
    />
  )
}