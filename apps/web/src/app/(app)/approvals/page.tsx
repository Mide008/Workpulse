// apps/web/src/app/(app)/approvals/page.tsx
import { createClient } from '@/lib/supabase/server'
import ApprovalsClient from './approvals-client'

export const metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: profile } = await sb
    .from('users')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <ApprovalsClient
      user={{
        id: user?.id ?? '',
        fullName: profile?.full_name ?? 'User',
        roleLevel: profile?.role_level ?? 3,
        workspaceId: profile?.workspace_id ?? '',
      }}
    />
  )
}