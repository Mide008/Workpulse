// apps/web/src/app/(app)/crm/companies/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompaniesClient from './companies-client'

export const metadata = { title: 'Companies — WorkPulse CRM' }

export default async function CompaniesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const supabaseAny = supabase as any

  const { data: companies } = await supabaseAny
    .from('companies')
    .select('*, contacts(id, full_name, status)')
    .eq('workspace_id', user.workspaceId)
    .order('name', { ascending: true })

  return <CompaniesClient companies={companies ?? []} user={user} />
}