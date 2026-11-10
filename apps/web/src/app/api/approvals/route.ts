import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  const mine = new URL(req.url).searchParams.get('mine') === '1'

  let q = (sb as any).from('approvals')
    .select('*, requester:users!approvals_requester_id_fkey(id,full_name,avatar_url), reviewer:users!approvals_reviewer_id_fkey(id,full_name)') // <-- Removed 'role'
    .eq('workspace_id', p?.workspace_id ?? '').order('created_at', { ascending: false })

  if (mine) q = q.eq('requester_id', user.id)

  const { data } = await q
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()
  if (!p?.workspace_id) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

  const body = await req.json()
  const { data, error } = await (sb as any).from('approvals').insert({
    workspace_id: p.workspace_id, requester_id: user.id, type: body.type, title: body.title,
    description: body.description || null, amount: body.amount || null,
    start_date: body.start_date || null, end_date: body.end_date || null, status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: managers } = await sb.from('users').select('id, role:roles(level)').eq('workspace_id', p.workspace_id)
  const targets = (managers ?? []).filter((m: any) => m.role?.level <= 2 && m.id !== user.id)

  await logActivity({
    workspaceId: p.workspace_id, userId: user.id, entityType: 'approval',
    entityId: data.id, entityTitle: body.title, action: 'approval_requested',
    metadata: { actorName: p.full_name, type: body.type },
    notifyUserIds: targets.map((m: any) => m.id),
  })

  return NextResponse.json(data, { status: 201 })
}