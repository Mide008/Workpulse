// apps/web/src/app/api/team/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

function resolveBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://workpulse-eta.vercel.app'
  if (baseUrl.includes('localhost')) baseUrl = 'https://workpulse-eta.vercel.app'
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
  return baseUrl
}

// GET — list pending invitations for the current workspace, with copyable links.
// Additive endpoint. POST contract below is unchanged.
export async function GET() {
  try {
    const sb = await createServerSupabaseClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
    const workspaceId = profile?.workspace_id
    if (!workspaceId) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

    const { data: invites, error } = await (sb as any)
      .from('invitations')
      .select('id, email, full_name, job_title, token, status, expires_at, created_at, role:roles(name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const baseUrl = resolveBaseUrl()
    const withLinks = (invites ?? []).map((inv: any) => ({
      ...inv,
      inviteLink: `${baseUrl}/invite?token=${inv.token}`,
    }))

    return NextResponse.json({ invites: withLinks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = await createServerSupabaseClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
    const workspaceId = profile?.workspace_id
    if (!workspaceId) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

    const { email, fullName, roleId, jobTitle } = await req.json()

    // Ensure we have the exact UUID of the role
    let finalRoleId = roleId
    if (roleId.length < 10) {
      const { data: roleData } = await sb.from('roles').select('id').eq('workspace_id', workspaceId).ilike('name', roleId).single()
      if (roleData) finalRoleId = roleData.id
    }

    const token = randomBytes(16).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invite, error } = await (sb as any).from('invitations').insert({
      workspace_id: workspaceId,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      full_name: fullName,
      job_title: jobTitle,
      role_id: finalRoleId, // Save the exact UUID
      token: token,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    }).select('*, role:roles(name)').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const inviteLink = `${resolveBaseUrl()}/invite?token=${token}`

    return NextResponse.json({ success: true, invite, inviteLink }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
