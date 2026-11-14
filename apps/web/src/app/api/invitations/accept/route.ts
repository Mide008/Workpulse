// apps/web/src/app/api/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { token, password, fullName } = await req.json()
    if (!token || !password || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    // 1. Lookup the invitation
    const { data: invite, error: inviteError } = await (supabaseAdmin as any)
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })

    // 2. Check if user exists in Auth
    // Cast listUsers() result to User[] — Supabase admin client without a Database
    // generic infers users as never[], which fails `tsc` on Vercel's clean build.
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const users = (existingUsers?.users ?? []) as User[]
    const existingUser = users.find((u) => u.email === invite.email)

    let userId = existingUser?.id

    if (existingUser) {
      // If they already have an account, update their password to the new one
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password })
    } else {
      // 3. Create a brand new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
      userId = authData.user.id
    }

    if (!userId) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })

    // 4. Link them to the workspace
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

    // 5. Mark invite accepted
    await (supabaseAdmin as any).from('invitations').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ success: true, email: invite.email })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
