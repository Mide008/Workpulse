import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import AppShell from '@/components/shell/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user = null

  try {
    user = await getCurrentUser()
  } catch {
    redirect('/login')
  }

  if (!user) redirect('/login')
  if (!user.workspaceId) redirect('/onboarding/workspace')

  return <AppShell user={user}>{children}</AppShell>
}