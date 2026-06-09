export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsClient from './notifications-client'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  // Cast to any to bypass strict type check for workspace_id column
  const { data: notifications } = await (supabase
    .from('notifications') as any)
    .select('id, title, message, type, read, created_at, link')
    .eq('workspace_id', user.workspaceId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <NotificationsClient notifications={notifications ?? []} userId={user.id} />
}