// apps/web/src/app/api/crm/contacts/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  const anySupabase = supabase as any

  const [{ data: contact }, { data: activities }, { data: deals }] = await Promise.all([
    anySupabase
      .from('contacts')
      .select('*, company:companies(id, name), owner:users!contacts_owner_id_fkey(id, full_name, avatar_url)')
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)
      .single(),
    anySupabase
      .from('crm_activities')
      .select('*, user:users!crm_activities_user_id_fkey(id, full_name, avatar_url)')
      .eq('contact_id', id!)
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: false }),
    anySupabase
      .from('deals')
      .select('id, title, value, stage, currency')
      .eq('contact_id', id!)
      .eq('workspace_id', ctx.workspaceId),
  ])

  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ contact, activities: activities ?? [], deals: deals ?? [] })
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.fullName !== undefined) updates.full_name = body.fullName
  if (body.email !== undefined) updates.email = body.email?.toLowerCase()
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.jobTitle !== undefined) updates.job_title = body.jobTitle
  if (body.companyId !== undefined) updates.company_id = body.companyId
  if (body.status !== undefined) updates.status = body.status
  if (body.source !== undefined) updates.source = body.source
  if (body.tags !== undefined) updates.tags = body.tags
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.lastContactedAt !== undefined) updates.last_contacted_at = body.lastContactedAt

  const { data: contact, error } = await (supabase as any)
    .from('contacts')
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ contact })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any)
    .from('contacts')
    .delete()
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})