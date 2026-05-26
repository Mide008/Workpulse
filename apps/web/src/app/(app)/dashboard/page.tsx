import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, progress, assigned_to')
    .eq('workspace_id', user.workspaceId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, priority, progress, end_date, color')
    .eq('workspace_id', user.workspaceId)
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <DashboardClient
      user={{
        id: user.id,
        fullName: user.fullName,
        workspaceName: user.workspaceName,
        roleLevel: user.roleLevel,
        primaryColor: user.primaryColor,
      }}
      tasks={(tasks as any[]) ?? []}
      projects={(projects as any[]) ?? []}
    />
  )
}