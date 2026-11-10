// apps/web/src/app/api/hr/leave/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function GET() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  const { data } = await (sb as any).from('leave_requests')
    .select('*, user:users!leave_requests_user_id_fkey(id,full_name,avatar_url)')
    .eq('workspace_id', p?.workspace_id ?? '').order('created_at', { ascending: false })

  return NextResponse.json({ leave: data ?? [] })
}

export async function POST(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()
  if (!p?.workspace_id) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

  const body = await req.json()
  const { data: leave, error } = await (sb as any).from('leave_requests').insert({
    workspace_id: p.workspace_id, user_id: user.id, type: body.type,
    start_date: body.startDate, end_date: body.endDate, reason: body.reason || null,
    days_requested: body.daysRequested ?? null, status: 'pending',
  }).select('*, user:users!leave_requests_user_id_fkey(id,full_name,avatar_url)').single()

  if (error) {
    console.error('HR Leave Insert Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: managers } = await sb.from('users').select('id, role:roles(level)').eq('workspace_id', p.workspace_id)
  const targets = (managers ?? []).filter((m: any) => m.role?.level <= 2 && m.id !== user.id)
  
  await logActivity({
    workspaceId: p.workspace_id, userId: user.id, entityType: 'leave',
    entityId: leave.id, entityTitle: body.type, action: 'leave_requested',
    metadata: { actorName: p.full_name },
    notifyUserIds: targets.map((m: any) => m.id),
  })

  return NextResponse.json({ leave }, { status: 201 })
}