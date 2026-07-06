// apps/web/src/app/api/crm/companies/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  let query = (supabase as any)
    .from('companies')
    .select('*, contacts(id)')
    .eq('workspace_id', ctx.workspaceId)
    .order('name', { ascending: true })

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ companies: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const { name, industry, website, phone, address, employeeCount, annualRevenue, notes } = body

  if (!name?.trim()) return Response.json({ error: 'Company name is required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: company, error } = await (supabase as any)
    .from('companies')
    .insert({
      workspace_id: ctx.workspaceId,
      name: name.trim(),
      industry: industry?.trim() || null,
      website: website?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      employee_count: employeeCount || null,
      annual_revenue: annualRevenue || null,
      notes: notes?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ company }, { status: 201 })
})