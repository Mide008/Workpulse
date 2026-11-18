// apps/web/src/app/api/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabaseAdmin = createAdminClient()
  
  // Added role:roles(name) to fetch the actual role name from the database
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('*, workspaces(name, primary_color), role:roles(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !data) {
    console.error('Invite GET error:', error, 'Token:', token)
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
  }

  return NextResponse.json({ invite: data })
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, fullName } = await req.json()
    if (!token || !password || !fullName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: invite, error: inviteError } = await (supabaseAdmin as any)
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const users = (existingUsers?.users ?? []) as User[]
    const existingUser = users.find(
      (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true, user_metadata: { full_name: fullName } }
      )
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
      }
      userId = authData.user.id
    }

    const { error: profileError } = await (supabaseAdmin as any).from('users').upsert({
      id: userId,
      workspace_id: invite.workspace_id,
      role_id: invite.role_id,
      full_name: fullName,
      email: invite.email,
      job_title: invite.job_title,
      is_active: true,
    })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    await (supabaseAdmin as any)
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, email: invite.email, existingAccount: Boolean(existingUser) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}