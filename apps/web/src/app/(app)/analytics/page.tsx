export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 2) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()

  const [{ data: tasks }, { data: members }, { data: blocked }] = await Promise.all([
    supabase.from('tasks').select('id,title,status,priority,due_date,completed_at,created_at,assigned_to,blocker_reason,blocker_category').eq('workspace_id', user.workspaceId),
    supabase.from('users').select('id,full_name,avatar_url,job_title').eq('workspace_id', user.workspaceId),
    supabase.from('tasks').select('id,title,blocker_reason,blocker_category').eq('workspace_id', user.workspaceId).eq('status', 'blocked'),
  ])

  return (
    <AnalyticsClient
      tasks={tasks ?? []}
      members={members ?? []}
      blockedTasks={blocked ?? []}
      currentUser={user}
    />
  )
}