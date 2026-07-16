// apps/web/src/app/(app)/hr/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HRClient from './hr-client'

export const metadata = { title: 'HR — WorkPulse' }

export default async function HRPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 2) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()
  const [{ data: leaveRequests }, { data: appraisals }, { data: members }] = await Promise.all([
    (supabase as any)
      .from('leave_requests')
      .select('*, user:users!leave_requests_user_id_fkey(id, full_name, avatar_url)')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('appraisals')
      .select('*, user:users!appraisals_user_id_fkey(id, full_name, avatar_url)')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, avatar_url, job_title, role:roles!users_role_id_fkey(name, level)')
      .eq('workspace_id', user.workspaceId)
      .eq('is_active', true),
  ])

  return (
    <HRClient
      leaveRequests={leaveRequests ?? []}
      appraisals={appraisals ?? []}
      members={members ?? []}
      user={user}
    />
  )
}