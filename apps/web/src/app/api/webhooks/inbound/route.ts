// apps/web/src/app/api/webhooks/inbound/route.ts
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') ?? req.nextUrl.searchParams.get('api_key')
  if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Look up workspace by API key stored in integrations
  const { data: integration } = await adminClient
    .from('workspace_integrations')
    .select('workspace_id, config')
    .eq('type', 'webhook_inbound')
    .eq('enabled', true)
    .filter('config->>api_key', 'eq', apiKey)  // more precise
    .maybeSingle()

  if (!integration) return Response.json({ error: 'Invalid API key' }, { status: 401 })

  const body = await req.json()
  const { event, data } = body

  if (event === 'create_task' && data?.title) {
    const { data: task, error } = await adminClient
      .from('tasks')
      .insert({
        workspace_id: integration.workspace_id,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? 'medium',
        status: data.status ?? 'not_started',
        due_date: data.due_date ?? null,
      })
      .select('id, title')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, task })
  }

  if (event === 'create_contact' && data?.full_name) {
    const { data: contact, error } = await adminClient
      .from('contacts')
      .insert({
        workspace_id: integration.workspace_id,
        full_name: data.full_name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        status: data.status ?? 'lead',
        source: data.source ?? 'Webhook',
        notes: data.notes ?? null,
      })
      .select('id, full_name')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, contact })
  }

  if (event === 'create_deal' && data?.title) {
    const { data: deal, error } = await adminClient
      .from('deals')
      .insert({
        workspace_id: integration.workspace_id,
        title: data.title,
        value: data.value ?? 0,
        currency: data.currency ?? 'USD',
        stage: data.stage ?? 'new',
      })
      .select('id, title')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, deal })
  }

  return Response.json({ success: true, message: 'Event received but no action matched', event })
}