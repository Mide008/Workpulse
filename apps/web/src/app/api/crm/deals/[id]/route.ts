// apps/web/src/app/api/crm/deals/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()

  const { data: current } = await (supabase as any)
    .from('deals')
    .select('stage, title')
    .eq('id', id!)
    .single()

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.value !== undefined) updates.value = Number(body.value)
  if (body.stage !== undefined) updates.stage = body.stage
  if (body.probability !== undefined) updates.probability = Number(body.probability)
  if (body.closeDate !== undefined) updates.close_date = body.closeDate
  if (body.description !== undefined) updates.description = body.description
  if (body.companyId !== undefined) updates.company_id = body.companyId
  if (body.contactId !== undefined) updates.contact_id = body.contactId
  if (body.lostReason !== undefined) updates.lost_reason = body.lostReason

  // Auto-set won/lost timestamps
  if (body.stage === 'won' && (current as any)?.stage !== 'won') {
    updates.won_at = new Date().toISOString()
    updates.probability = 100
  }
  if (body.stage === 'lost' && (current as any)?.stage !== 'lost') {
    updates.lost_at = new Date().toISOString()
    updates.probability = 0
  }

  const { data: deal, error } = await (supabase as any)
    .from('deals')
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*, company:companies(id, name), contact:contacts(id, full_name)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (body.stage && body.stage !== (current as any)?.stage) {
    const action = body.stage === 'won' ? 'deal_won' : body.stage === 'lost' ? 'deal_lost' : 'deal_stage_changed'
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'deal',
      entityId: id!,
      entityTitle: (current as any)?.title ?? 'Deal',
      action,
      metadata: { stage: body.stage, actorName: ctx.userFullName },
    })
  }

  return Response.json({ deal })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('deals')
    .delete()
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})