// apps/web/src/app/api/crm/deals/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await (supabase as any)
    .from('deals')
    .select(`
      *,
      company:companies(id, name),
      contact:contacts(id, full_name),
      owner:users!deals_owner_id_fkey(id, full_name, avatar_url)
    `)
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ deals: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const { title, value = 0, currency = 'USD', stage = 'new', companyId, contactId, closeDate, probability = 20, description } = body

  if (!title?.trim()) return Response.json({ error: 'Deal title is required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: deal, error } = await (supabase as any)
    .from('deals')
    .insert({
      workspace_id: ctx.workspaceId,
      owner_id: ctx.userId,
      title: title.trim(),
      value: Number(value),
      currency,
      stage,
      company_id: companyId || null,
      contact_id: contactId || null,
      close_date: closeDate || null,
      probability: Number(probability),
      description: description?.trim() || null,
    })
    .select('*, company:companies(id, name), contact:contacts(id, full_name), owner:users!deals_owner_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await logActivity({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    entityType: 'deal',
    entityId: (deal as any).id,
    entityTitle: (deal as any).title,
    action: 'deal_created',
    metadata: { value, stage, actorName: ctx.userFullName },
  })

  return Response.json({ deal }, { status: 201 })
})