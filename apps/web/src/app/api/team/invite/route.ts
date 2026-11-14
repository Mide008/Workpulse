// apps/web/src/app/api/team/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user making the request
    const sb = await createServerSupabaseClient()
    const { data: { user } } = await sb.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the user's workspace and verify they have permission (Manager or Admin)
    const { data: profile } = await sb
      .from('users')
      .select('workspace_id, role:roles(level)')
      .eq('id', user.id)
      .single()

    const workspaceId = (profile as any)?.workspace_id
    const roleLevel = (profile as any)?.role?.level ?? 4

    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace attached to this user' }, { status: 400 })
    }

    if (roleLevel > 2) {
      return NextResponse.json({ error: 'Only managers and admins can invite members' }, { status: 403 })
    }

    // 3. Parse the incoming request body
    const body = await req.json()
    const { email, fullName, roleId, jobTitle } = body

    if (!email || !fullName || !roleId) {
      return NextResponse.json({ error: 'Email, full name, and role are required' }, { status: 400 })
    }

    // 4. Handle the role ID lookup safely
    // The frontend might send a specific UUID or just the string "Staff"
    let finalRoleId = roleId
    if (roleId.length < 10) { // It's a string name, not a UUID
      const { data: roleData } = await sb
        .from('roles')
        .select('id')
        .eq('workspace_id', workspaceId)
        .ilike('name', roleId)
        .single()
      if (roleData) finalRoleId = roleData.id
    }

    // 5. Check if there is already a pending invite for this email
    const { data: existingInvite } = await (sb as any)
      .from('invitations')
      .select('id, token')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle()

    let token = ''
    let invite = null

    if (existingInvite) {
      // If they were already invited, just refresh their token and details
      token = existingInvite.token
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: updated } = await (sb as any)
        .from('invitations')
        .update({
          full_name: fullName,
          job_title: jobTitle,
          role_id: finalRoleId,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', existingInvite.id)
        .select('*, role:roles(name)')
        .single()
      invite = updated
    } else {
      // 6. Create a brand new invite
      token = randomBytes(16).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Valid for 7 days

      const { data: created, error } = await (sb as any)
        .from('invitations')
        .insert({
          workspace_id: workspaceId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          job_title: jobTitle,
          role_id: finalRoleId,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select('*, role:roles(name)')
        .single()

      if (error) {
        console.error('Invite insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      invite = created
    }

    // 7. Construct the Invite Link using the Environment Variable
    // We explicitly use process.env.NEXT_PUBLIC_APP_URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://workpulse-eta.vercel.app'
    
    // Safety check: remove trailing slash if the user accidentally added one in Vercel
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    const inviteLink = `${baseUrl}/invite?token=${token}`

    // 8. Return the success response
    return NextResponse.json({ 
      success: true, 
      invite, 
      inviteLink 
    }, { status: 201 })

  } catch (err: any) {
    console.error('Invite route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
