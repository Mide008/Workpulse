// apps/web/src/app/(app)/standup/page.tsx
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import StandupClient from './standup-client'

export const metadata = { title: 'Work Log' }

export default async function StandupPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <StandupClient user={{ id: user.id, fullName: user.fullName, roleLevel: user.roleLevel }} />
}