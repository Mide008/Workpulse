// apps/web/src/app/api/crm/contacts/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')

  // Cast to any to bypass type checks for CRM tables
  let query = (supabase as any)
    .from('contacts')
    .select(`
      *,
      company:companies(id, name),
      owner:users!contacts_owner_id_fkey(id, full_name, avatar_url)
    `)
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('full_name', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ contacts: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const { fullName, email, phone, jobTitle, companyId, status = 'lead', source, tags = [], notes } = body

  if (!fullName?.trim()) return Response.json({ error: 'Full name is required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: contact, error } = await (supabase as any)
    .from('contacts')
    .insert({
      workspace_id: ctx.workspaceId,
      owner_id: ctx.userId,
      full_name: fullName.trim(),
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      job_title: jobTitle?.trim() || null,
      company_id: companyId || null,
      status,
      source: source?.trim() || null,
      tags,
      notes: notes?.trim() || null,
    })
    .select('*, company:companies(id, name), owner:users!contacts_owner_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await logActivity({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    entityType: 'contact',
    entityId: (contact as any).id,
    entityTitle: (contact as any).full_name,
    action: 'contact_created',
    metadata: { status, actorName: ctx.userFullName },
  })

  return Response.json({ contact }, { status: 201 })
})