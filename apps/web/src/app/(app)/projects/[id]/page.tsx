// apps/web/src/app/(app)/projects/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectDetailClient from './project-detail-client'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const [{ data: project }, { data: tasks }, { data: members }, { data: activity }] = await Promise.all([
    supabase
      .from('projects')
      .select(`*, project_members(user_id, user:users!project_members_user_id_fkey(id, full_name, avatar_url, job_title))`)
      .eq('id', params.id)
      .eq('workspace_id', user.workspaceId)
      .single(),
    supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url)')
      .eq('project_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, avatar_url, job_title')
      .eq('workspace_id', user.workspaceId),
    // Cast to any for activity_logs
    (supabase as any)
      .from('activity_logs')
      .select('*, user:users!activity_logs_user_id_fkey(id, full_name, avatar_url)')
      .eq('entity_id', params.id)
      .eq('entity_type', 'project')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!project) redirect('/projects')

  return (
    <ProjectDetailClient
      project={project as any}
      tasks={tasks ?? []}
      members={members ?? []}
      activity={activity ?? []}
      user={user}
    />
  )
}