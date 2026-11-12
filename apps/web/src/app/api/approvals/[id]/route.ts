// apps/web/src/app/api/approvals/[id]/route.ts
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
  const now = new Date().toISOString()

  const { data, error } = await (sb as any).from('approvals')
    .update({
      status: body.status,
      reviewer_id: user.id,
      reviewed_at: now,
      review_note: body.note || null,
    })
    .eq('id', id)
    .select('*, requester:users!approvals_requester_id_fkey(id,full_name), reviewer:users!approvals_reviewer_id_fkey(id,full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the requester
  if (data?.requester_id && data.requester_id !== user.id) {
    try {
      await sb.from('notifications').insert({
        workspace_id: data.workspace_id,
        user_id: data.requester_id,
        type: body.status === 'approved' ? 'success' : 'warning',
        title: `Your request "${data.title}" was ${body.status}`,
        body: body.note || null,
        entity_id: data.id,
        read: false,
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }
  }

  await logActivity({
    workspaceId: data.workspace_id, userId: user.id, entityType: 'approval',
    entityId: data.id, entityTitle: data.title,
    action: body.status === 'approved' ? 'approval_approved' : 'approval_rejected',
    metadata: { actorName: p?.full_name, status: body.status },
  })

  return NextResponse.json({ approval: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await (sb as any).from('approvals')
    .delete()
    .eq('id', id)
    .eq('requester_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}