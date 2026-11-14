// apps/web/src/app/api/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { token, password, fullName } = await req.json()
    if (!token || !password || !fullName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Lookup the invitation
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

    // 2. Check if an Auth user already exists (inviteUserByEmail creates one
    //    with no password — that's why the client-side sign-in was failing).
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const users = (existingUsers?.users ?? []) as User[]
    const existingUser = users.find(
      (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      // Set/replace the password on the existing auth user so the client
      // can sign in immediately after this call returns.
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true, user_metadata: { full_name: fullName } }
      )
      if (updateErr) {
        console.error('[invite-accept] password update failed:', updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 400 })
      }
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message ?? 'Failed to create user' },
          { status: 400 }
        )
      }
      userId = authData.user.id
    }

    // 3. Link to workspace (idempotent — upsert by primary key)
    const { error: profileError } = await (supabaseAdmin as any).from('users').upsert({
      id: userId,
      workspace_id: invite.workspace_id,
      role_id: invite.role_id,
      full_name: fullName,
      email: invite.email,
      job_title: invite.job_title,
      is_active: true,
    })
    if (profileError) {
      console.error('[invite-accept] profile upsert failed:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 4. Mark invite accepted
    await (supabaseAdmin as any)
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({
      success: true,
      email: invite.email,
      existingAccount: Boolean(existingUser),
    })
  } catch (err: any) {
    console.error('[invite-accept] unhandled:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
