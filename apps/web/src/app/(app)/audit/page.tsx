// apps/web/src/app/(app)/audit/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditClient from './audit-client'

export const metadata = { title: 'Audit Trail' }

export default async function AuditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 1) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)
    .from('activity_logs')
    .select('*, user:users!activity_logs_user_id_fkey(id, full_name, avatar_url)')
    .eq('workspace_id', user.workspaceId)
    .order('created_at', { ascending: false })
    .limit(200)

  return <AuditClient logs={data ?? []} workspaceId={user.workspaceId} />
}