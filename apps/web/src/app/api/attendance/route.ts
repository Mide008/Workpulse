// apps/web/src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  
  // Cast to 'any' to bypass missing local TS types
  const { data } = await (sb as any).from('attendance_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .maybeSingle()

  return NextResponse.json({ log: data ?? null })
}

export async function POST(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  if (!p?.workspace_id) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const { action, latitude, longitude } = await req.json()
  const today = new Date().toISOString().split('T')[0]

  if (action === 'clock_in') {
    // Cast to 'any' to bypass missing local TS types
    const { data, error } = await (sb as any).from('attendance_logs').insert({
      workspace_id: p.workspace_id,
      user_id: user.id,
      log_date: today,
      latitude: latitude || null,
      longitude: longitude || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  }

  if (action === 'clock_out') {
    // Cast to 'any' to bypass missing local TS types
    const { data, error } = await (sb as any).from('attendance_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('log_date', today)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}