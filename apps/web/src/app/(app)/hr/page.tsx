// apps/web/src/app/(app)/hr/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HRClient from './hr-client'

export const metadata = { title: 'HR — WorkPulse' }

export default async function HRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch current user profile + role
  const { data: profile } = await supabase
    .from('users')
    .select('workspace_id, full_name, role:roles(level)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workspace_id) redirect('/onboarding/workspace')

  // 2. Fetch all leave requests for the workspace
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*, user:users!leave_requests_user_id_fkey(id, full_name, avatar_url)')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false })

  // 3. Fetch all appraisals
  const { data: appraisals } = await supabase
    .from('appraisals')
    .select('*, user:users!appraisals_user_id_fkey(id, full_name, avatar_url)')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false })

  // 4. Fetch team members (to populate the appraisal dropdown)
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('workspace_id', profile.workspace_id)

  const userData = {
    id: user.id,
    fullName: profile.full_name || 'User',
    roleLevel: (profile.role as any)?.level ?? 4, // 1=Exec, 2=Manager, 3=Lead, 4=Staff
  }

  return (
    <HRClient
      leaveRequests={leaveRequests ?? []}
      appraisals={appraisals ?? []}
      members={members ?? []}
      user={userData}
    />
  )
}