export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect, notFound } from 'next/navigation'
import ProjectDetailClient from './project-detail-client'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name),
      project_members(
        role,
        user:users!project_members_user_id_fkey(id, full_name, avatar_url, job_title)
      ),
      tasks(
        id, title, status, priority, progress, due_date,
        assigned_to, created_at, blocker_reason,
        assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true, referencedTable: 'tasks' })
    .single()

  if (!project) notFound()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)

  return (
    <ProjectDetailClient
      project={project as any}
      currentUser={user}
      workspaceMembers={(members as any[]) ?? []}
    />
  )
}