export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  roleId: z.string().min(1),
  jobTitle: z.string().min(1),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid data' }, { status: 400 })

  const { email, fullName, roleId, jobTitle } = parsed.data
  const supabase = await createServerSupabaseClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('workspace_id', ctx.workspaceId)
    .maybeSingle()

  if (existing) return Response.json({ error: 'User already in workspace' }, { status: 409 })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const inviteUrl = `${appUrl}/invite?token=${token}`

  const { data: invite, error } = await supabase
    .from('invitations')
    .insert({
      workspace_id: ctx.workspaceId,
      email: email.toLowerCase().trim(),
      token,
      role: jobTitle,
      invited_by: ctx.userId,
      expires_at: expiresAt,
      status: 'pending',
    } as any)
    .select('*')
    .single()

  if (error) {
    console.error('Team invite error:', error)
    return Response.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  // Try Supabase invite
  let emailSent = false
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error: invErr } = await adminClient.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      { redirectTo: inviteUrl, data: { workspace_id: ctx.workspaceId, role: jobTitle, full_name: fullName } }
    )
    if (!invErr) emailSent = true
    else console.log('Supabase invite note:', invErr.message)
  } catch (err: any) {
    console.error('Admin invite error:', err?.message)
  }

  // Resend fallback
  if (!emailSent && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `WorkPulse <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
          to: [email.toLowerCase().trim()],
          subject: `You've been invited to join the team on WorkPulse`,
          html: `<p>Hi ${fullName},</p><p>You've been invited as <strong>${jobTitle}</strong>.</p><p><a href="${inviteUrl}">Accept Invitation</a></p><p>Or copy: ${inviteUrl}</p>`,
        }),
      })
      if (res.ok) emailSent = true
    } catch {}
  }

  return Response.json({ success: true, emailSent, inviteUrl, member: invite })
})