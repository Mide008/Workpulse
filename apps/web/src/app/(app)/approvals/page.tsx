// apps/web/src/app/(app)/approvals/page.tsx
import { createClient } from '@/lib/supabase/server'
import ApprovalsClient from './approvals-client'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('users')
    .select('*, role:roles(level)')
    .eq('id', user.id)
    .single()

  return (
    <ApprovalsClient
      user={{
        id: user.id,
        fullName: profile?.full_name ?? 'User',
        roleLevel: (profile as any)?.role?.level ?? 4,
        workspaceId: profile?.workspace_id ?? '',
      }}
    />
  )
}