// apps/web/src/app/api/hr/leave/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (!['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()

  const { data, error } = await (sb as any).from('leave_requests').update({
    status: body.status,
    reviewed_by: user.id,
    reviewed_at: body.reviewedAt || new Date().toISOString(),
  })
  .eq('id', id)
  .select('*, user:users!leave_requests_user_id_fkey(id,full_name,avatar_url)')
  .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.user_id) {
    await logActivity({
      workspaceId: data.workspace_id, userId: user.id, entityType: 'leave',
      entityId: data.id, entityTitle: data.type,
      action: body.status === 'approved' ? 'leave_approved' : 'leave_rejected',
      metadata: { actorName: p?.full_name, status: body.status },
      notifyUserIds: [data.user_id],
    })
  }

  return NextResponse.json({ leave: data })
}