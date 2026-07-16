// apps/web/src/app/(app)/agents/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgentsClient from './agents-client'

export const metadata = { title: 'Agent Builder — WorkPulse' }

export default async function AgentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 2) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()
  // Cast to any to bypass type checking for new tables
  const [{ data: rules }, { data: runs }] = await Promise.all([
    (supabase as any)
      .from('agent_rules')
      .select('*')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('agent_runs')
      .select('id, agent_type, status, ran_at, result')
      .eq('workspace_id', user.workspaceId)
      .order('ran_at', { ascending: false })
      .limit(20),
  ])

  return <AgentsClient rules={rules ?? []} runs={runs ?? []} user={user} />
}