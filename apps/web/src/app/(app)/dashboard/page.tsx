// apps/web/src/app/(app)/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, onboarding_completed, onboarding_steps')
    .eq('id', user.workspaceId)
    .single()

  return (
    <DashboardClient
      user={user}
      workspaceId={user.workspaceId}
      onboardingCompleted={(workspace as any)?.onboarding_completed ?? false}
      onboardingSteps={(workspace as any)?.onboarding_steps ?? {
        created_task: false,
        invited_member: false,
        created_project: false,
        set_goal: false,
        generated_report: false,
      }}
    />
  )
}