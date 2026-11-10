import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (!['approved', 'rejected'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()

  const { data, error } = await (sb as any).from('approvals')
    .update({ status: body.status, reviewer_id: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id).select('*, requester:users!approvals_requester_id_fkey(id,full_name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.requester?.id) {
    await logActivity({
      workspaceId: data.workspace_id, userId: user.id, entityType: 'approval',
      entityId: data.id, entityTitle: data.title,
      action: body.status === 'approved' ? 'approval_approved' : 'approval_rejected',
      metadata: { actorName: p?.full_name, status: body.status },
      notifyUserIds: [data.requester.id],
    })
  }
  
  return NextResponse.json(data)
}