// apps/web/src/app/api/crm/companies/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.industry !== undefined) updates.industry = body.industry
  if (body.website !== undefined) updates.website = body.website
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.address !== undefined) updates.address = body.address
  if (body.employeeCount !== undefined) updates.employee_count = body.employeeCount
  if (body.annualRevenue !== undefined) updates.annual_revenue = body.annualRevenue
  if (body.notes !== undefined) updates.notes = body.notes

  const { data: company, error } = await (supabase as any)
    .from('companies')
    .update(updates)
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ company })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('companies')
    .delete()
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})