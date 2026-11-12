// apps/web/src/app/api/standup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  const date = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const { data } = await (sb as any).from('standup_logs')
    .select('*, user:users(id,full_name,avatar_url,job_title)')
    .eq('workspace_id', p?.workspace_id ?? '')
    .eq('log_date', date)
    .order('created_at', { ascending: false })

  return NextResponse.json({ logs: data ?? [] }) // FIX: { logs: [...] }
}

export async function POST(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()
  if (!p?.workspace_id) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

  const body = await req.json()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await (sb as any).from('standup_logs').upsert({
    workspace_id: p.workspace_id, user_id: user.id, log_date: today,
    did: body.did, doing: body.doing, blockers: body.blockers ?? null,
    leads_added: body.leads_added ?? 0, leads_converted: body.leads_converted ?? 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,user_id,log_date' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    workspaceId: p.workspace_id, userId: user.id, entityType: 'worklog',
    entityId: data.id, entityTitle: 'Daily Work Log', action: 'worklog_submitted',
    metadata: { actorName: p.full_name },
  })

  return NextResponse.json({ log: data }, { status: 201 }) // FIX: { log: data }
}