// apps/web/src/app/api/crm/activities/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const contactId = searchParams.get('contactId')
  const dealId = searchParams.get('dealId')

  // Cast supabase to any to avoid type issues with CRM tables
  const query = (supabase as any)
    .from('crm_activities')
    .select('*, user:users!crm_activities_user_id_fkey(id, full_name, avatar_url), contact:contacts(id, full_name), deal:deals(id, title)')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })

  if (contactId) query.eq('contact_id', contactId)
  if (dealId) query.eq('deal_id', dealId)

  const { data, error } = await query.limit(50)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ activities: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const { type, subject, description, outcome, contactId, companyId, dealId, scheduledAt, completedAt } = body

  if (!type) return Response.json({ error: 'Activity type is required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: activity, error } = await (supabase as any)
    .from('crm_activities')
    .insert({
      workspace_id: ctx.workspaceId,
      user_id: ctx.userId,
      type,
      subject: subject?.trim() || null,
      description: description?.trim() || null,
      outcome: outcome?.trim() || null,
      contact_id: contactId || null,
      company_id: companyId || null,
      deal_id: dealId || null,
      scheduled_at: scheduledAt || null,
      completed_at: completedAt || new Date().toISOString(),
    })
    .select('*, user:users!crm_activities_user_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ activity }, { status: 201 })
})