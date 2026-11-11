// apps/web/src/app/(app)/hr/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HRClient from './hr-client'

export const metadata = { title: 'HR — WorkPulse' }

export default async function HRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('workspace_id, full_name, role:roles(level)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.workspace_id) redirect('/onboarding/workspace')

  // Cast to `any` because leave_requests / appraisals are not yet in database.types.ts
  const { data: leaveRequests } = await (supabase as any)
    .from('leave_requests')
    .select('*, user:users(id, full_name, avatar_url)')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false })

  const { data: appraisals } = await (supabase as any)
    .from('appraisals')
    .select('*, user:users(id, full_name, avatar_url)')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('workspace_id', profile.workspace_id)

  const userData = {
    id: user.id,
    fullName: profile.full_name || 'User',
    roleLevel: (profile.role as any)?.level ?? 4,
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