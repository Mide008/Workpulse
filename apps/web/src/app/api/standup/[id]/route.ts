// apps/web/src/app/api/standup/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await (sb as any)
    .from('standup_logs')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Log not found' }, { status: 404 })
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'You can only edit your own logs' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await (sb as any)
    .from('standup_logs')
    .update({
      did: body.did,
      doing: body.doing,
      blockers: body.blockers ?? null,
      leads_added: body.leads_added ?? 0,
      leads_converted: body.leads_converted ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, user:users(id,full_name,avatar_url,job_title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await (sb as any)
    .from('standup_logs')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Log not found' }, { status: 404 })
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'You can only delete your own logs' }, { status: 403 })
  }

  const { error } = await (sb as any).from('standup_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}