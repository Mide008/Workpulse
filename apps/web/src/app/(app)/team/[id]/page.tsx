import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect, notFound } from 'next/navigation'
import TeamMemberClient from './team-member-client'

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: member } = await supabase
    .from('users')
    .select('*, role:roles(name, level, color)')
    .eq('id', id)
    .eq('workspace_id', user.workspaceId)
    .single()

  if (!member) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, progress, created_at, project:projects(id, name, color)')
    .eq('assigned_to', id)
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: kpiData } = await supabase
    .from('kpi_snapshots')
    .select('*')
    .eq('user_id', id)
    .eq('workspace_id', user.workspaceId)
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  return (
    <TeamMemberClient
      member={member as any}
      tasks={(tasks as any[]) ?? []}
      latestKpi={kpiData as any}
      currentUser={user}
    />
  )
}