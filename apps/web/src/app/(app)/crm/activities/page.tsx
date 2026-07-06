// apps/web/src/app/(app)/crm/activities/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivitiesClient from './activities-client'

export const metadata = { title: 'Activities — WorkPulse CRM' }

export default async function ActivitiesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const supabaseAny = supabase as any

  const [{ data: activities }, { data: contacts }, { data: deals }] = await Promise.all([
    supabaseAny
      .from('crm_activities')
      .select('*, user:users!crm_activities_user_id_fkey(id, full_name, avatar_url), contact:contacts(id, full_name), deal:deals(id, title)')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAny.from('contacts').select('id, full_name').eq('workspace_id', user.workspaceId),
    supabaseAny.from('deals').select('id, title').eq('workspace_id', user.workspaceId),
  ])

  return <ActivitiesClient activities={activities ?? []} contacts={contacts ?? []} deals={deals ?? []} user={user} />
}