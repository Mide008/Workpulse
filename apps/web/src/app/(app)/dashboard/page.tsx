export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <DashboardClient user={user} />
}