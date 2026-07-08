// apps/web/src/app/reports/[token]/page.tsx
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SharedReportClient from './shared-report-client'

export default async function SharedReportPage({ params }: { params: { token: string } }) {
  const supabase = await createServerSupabaseClient()

  // Cast to any to bypass type checks for shared_reports
  const { data: report } = await (supabase as any)
    .from('shared_reports')
    .select('*')
    .eq('token', params.token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!report) notFound()

  return <SharedReportClient report={report as any} />
}