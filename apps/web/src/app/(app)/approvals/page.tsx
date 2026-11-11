// apps/web/src/app/(app)/approvals/page.tsx
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import ApprovalsClient from './approvals-client'

export const metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <ApprovalsClient user={{ id: user.id, fullName: user.fullName, roleLevel: user.roleLevel }} />
}