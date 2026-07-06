// apps/web/src/app/(app)/crm/pipeline/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PipelineClient from './pipeline-client'

export const metadata = { title: 'Pipeline — WorkPulse CRM' }

export default async function PipelinePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const supabaseAny = supabase as any

  const [{ data: deals }, { data: contacts }, { data: companies }, { data: members }] = await Promise.all([
    supabaseAny
      .from('deals')
      .select('*, company:companies(id, name), contact:contacts(id, full_name), owner:users!deals_owner_id_fkey(id, full_name, avatar_url)')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false }),
    supabaseAny.from('contacts').select('id, full_name').eq('workspace_id', user.workspaceId),
    supabaseAny.from('companies').select('id, name').eq('workspace_id', user.workspaceId),
    supabaseAny.from('users').select('id, full_name').eq('workspace_id', user.workspaceId),
  ])

  return (
    <PipelineClient
      deals={deals ?? []}
      contacts={contacts ?? []}
      companies={companies ?? []}
      members={members ?? []}
      user={user}
    />
  )
}