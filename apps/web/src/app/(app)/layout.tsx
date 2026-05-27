export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AppShell from '@/components/shell/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user = null
  try {
    user = await getCurrentUser()
  } catch {
    redirect('/login')
  }

  if (!user) {
    // Check if there's an authenticated Supabase session even without a profile
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) redirect('/login')

    // Auth user exists but no profile — send to onboarding
    redirect('/onboarding/workspace')
  }

  if (!user.workspaceId) redirect('/onboarding/workspace')

  return <AppShell user={user}>{children}</AppShell>
}