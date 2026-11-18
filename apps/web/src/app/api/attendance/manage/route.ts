import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id, role:roles(level)').eq('id', user.id).single()
  if (!p?.workspace_id || (p as any).role?.level > 2) {
    return NextResponse.json({ error: 'Unauthorized. Manager access required.' }, { status: 403 })
  }

  const date = new Date().toISOString().split('T')[0]

  const { data, error } = await (sb as any).from('attendance_logs')
    .select('*, user:users(full_name, avatar_url, job_title)')
    .eq('workspace_id', p.workspace_id)
    .eq('log_date', date)
    .order('clock_in', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}