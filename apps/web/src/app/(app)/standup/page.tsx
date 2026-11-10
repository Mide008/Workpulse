// apps/web/src/app/(app)/standup/page.tsx
import { createClient } from '@/lib/supabase/server'
import StandupClient from './standup-client'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Work Log' }

export default async function StandupPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('users')
    .select('*, role:roles(level)')
    .eq('id', user.id)
    .single()

  return (
    <StandupClient
      user={{
        id: user.id,
        fullName: profile?.full_name ?? 'User',
        roleLevel: (profile as any)?.role?.level ?? 4,
        role: (profile as any)?.role?.name ?? 'Staff',
        jobTitle: profile?.job_title ?? '',
        workspaceId: profile?.workspace_id ?? '',
      }}
    />
  )
}