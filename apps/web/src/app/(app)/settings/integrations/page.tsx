// apps/web/src/app/(app)/settings/integrations/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntegrationsClient from './integrations-client'

export const metadata = { title: 'Integrations' }

export default async function IntegrationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 1) redirect('/settings/workspace')

  const supabase = await createServerSupabaseClient()
  // Cast to any to bypass type checking for workspace_integrations table
  const { data: integrations } = await (supabase as any)
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', user.workspaceId)

  return <IntegrationsClient integrations={integrations ?? []} workspaceId={user.workspaceId} />
}