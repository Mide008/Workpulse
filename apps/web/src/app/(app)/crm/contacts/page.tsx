// apps/web/src/app/(app)/crm/contacts/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsClient from './contacts-client'

export const metadata = { title: 'Contacts — WorkPulse CRM' }

export default async function ContactsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const supabaseAny = supabase as any

  const [{ data: contacts }, { data: companies }, { data: members }] = await Promise.all([
    supabaseAny
      .from('contacts')
      .select('*, company:companies(id, name), owner:users!contacts_owner_id_fkey(id, full_name, avatar_url)')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false }),
    supabaseAny.from('companies').select('id, name').eq('workspace_id', user.workspaceId),
    supabaseAny.from('users').select('id, full_name').eq('workspace_id', user.workspaceId),
  ])

  return <ContactsClient contacts={contacts ?? []} companies={companies ?? []} members={members ?? []} user={user} />
}