// apps/web/src/app/api/team/members/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sb = await createServerSupabaseClient()
    
    // 1. Verify the requester is logged in
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Verify the requester is a Manager/CEO
    const { data: profile } = await sb.from('users').select('workspace_id, role:roles(level)').eq('id', user.id).single()
    if (!profile?.workspace_id || (profile as any).role?.level > 2) {
      return NextResponse.json({ error: 'Only managers can remove members' }, { status: 403 })
    }

    // 3. Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    // 4. Soft-delete the user (sets is_active to false so they lose access but data remains)
    const { error } = await (sb as any)
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}