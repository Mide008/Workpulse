// apps/web/src/app/(app)/settings/billing/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from './billing-client'

export const metadata = { title: 'Billing & Plan' }

export default async function BillingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roleLevel > 1) redirect('/settings/workspace')

  const supabase = await createServerSupabaseClient()
  
  // Fetch workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, plan, plan_seats, plan_expires_at, billing_email')
    .eq('id', user.workspaceId)
    .single()

  // Fetch usage counts
  const { count: memberCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', user.workspaceId)

  const { count: taskCount } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)

  const { count: projectCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', user.workspaceId)
    .is('deleted_at', null)

  // Fetch payment history (for the BillingClient UI)
  const { data: payments } = await (supabase as any)
    .from('workspace_payments')
    .select('*')
    .eq('workspace_id', user.workspaceId)
    .order('paid_at', { ascending: false })

  return (
    <BillingClient
      workspace={workspace as any}
      usage={{ members: memberCount ?? 0, tasks: taskCount ?? 0, projects: projectCount ?? 0 }}
      payments={payments ?? []}
      payEnabled={false}
      chargeCurrency="USD"
      usdRate={1}
    />
  )
}