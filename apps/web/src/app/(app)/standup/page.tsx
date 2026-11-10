// apps/web/src/app/(app)/standup/page.tsx
import { createClient } from '@/lib/supabase/server'
import StandupClient from './standup-client'

export const metadata = { title: 'Work Log' }

export default async function StandupPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: profile } = await sb
    .from('users')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <StandupClient
      user={{
        id: user?.id ?? '',
        fullName: profile?.full_name ?? 'User',
        roleLevel: profile?.role_level ?? 3,
        role: profile?.role ?? 'Staff',
        jobTitle: profile?.job_title ?? '',
        workspaceId: profile?.workspace_id ?? '',
      }}
    />
  )
}