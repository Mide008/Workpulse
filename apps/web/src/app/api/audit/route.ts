// apps/web/src/app/api/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  
  const { data } = await (sb as any).from('activity_logs')
    .select('*, user:users(id,full_name,avatar_url)')
    .eq('workspace_id', p?.workspace_id ?? '')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json(data ?? [])
}