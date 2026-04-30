import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect, notFound } from 'next/navigation'
import TaskDetailClient from './task-detail-client'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url, email, job_title),
      creator:users!tasks_created_by_fkey(id, full_name, avatar_url),
      project:projects(id, name, color),
      comments(
        id, content, created_at, is_edited,
        author:users!comments_user_id_fkey(id, full_name, avatar_url)
      ),
      attachments(
        id, file_name, file_url, file_size, file_type, created_at,
        uploader:users!attachments_uploaded_by_fkey(id, full_name)
      ),
      task_activities(
        id, action, old_value, new_value, created_at,
        actor:users!task_activities_user_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true, referencedTable: 'comments' })
    .order('created_at', { ascending: false, referencedTable: 'task_activities' })
    .single()

  if (!task) notFound()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)

  return (
    <TaskDetailClient
      task={task as any}
      currentUser={user}
      members={(members as any[]) ?? []}
    />
  )
}