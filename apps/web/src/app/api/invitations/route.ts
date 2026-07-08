/* apps/web/src/app/api/invitations/route.ts */
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { validateEmailFormat, validateEmailDomain } from '@/lib/email-validation'

const schema = z.object({
  email: z.string().email(),
  role: z.string().default('Staff'),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid email' }, { status: 400 })

  const { email, role } = parsed.data
  const cleanEmail = email.toLowerCase().trim()

  // ----- Email validation (client‑side format + server‑side DNS) -----
  const formatCheck = validateEmailFormat(cleanEmail)
  if (!formatCheck.valid) {
    return Response.json({ error: formatCheck.error }, { status: 400 })
  }

  const domainCheck = await validateEmailDomain(cleanEmail)
  if (!domainCheck.valid) {
    return Response.json({ error: domainCheck.error }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const [{ data: workspace }, { data: inviter }] = await Promise.all([
    supabase.from('workspaces').select('name, primary_color').eq('id', ctx.workspaceId).single(),
    supabase.from('users').select('full_name').eq('id', ctx.userId).single(),
  ])

  const workspaceName = (workspace as any)?.name ?? 'WorkPulse'
  const inviterName = (inviter as any)?.full_name ?? 'Your workspace admin'
  const brandColor = (workspace as any)?.primary_color ?? '#6366F1'
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'
  const inviteUrl = `${appUrl}/invite?token=${token}`

  const { error: insertError } = await supabase.from('invitations').insert({
    workspace_id: ctx.workspaceId,
    email: cleanEmail,
    token,
    role,
    invited_by: ctx.userId,
    expires_at: expiresAt,
    status: 'pending',
  } as any)

  if (insertError) {
    console.error('Insert error:', insertError)
    return Response.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  // ---- Onboarding step tracking (cast to any to fix TypeScript) ----
  await (supabase as any).rpc('mark_onboarding_step', {
    workspace_id_param: ctx.workspaceId,
    step_name: 'invited_member',
  })

  let emailSent = false

  // Try Supabase Admin invite first (works for new users, sends Supabase's own email)
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error } = await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo: inviteUrl,
      data: { workspace_id: ctx.workspaceId, role, workspace_name: workspaceName },
    })
    if (!error) {
      emailSent = true
      console.log('Supabase invite sent to:', cleanEmail)
    } else {
      console.log('Supabase invite note:', error.message)
    }
  } catch (err: any) {
    console.error('Supabase admin error:', err?.message)
  }

  // Try Resend if Supabase failed (existing users)
  if (!emailSent && process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `WorkPulse <${fromEmail}>`,
          to: [cleanEmail],
          subject: `${inviterName} invited you to join ${workspaceName}`,
          html: buildInviteHtml({ inviterName, workspaceName, role, inviteUrl, brandColor }),
        }),
      })
      const resBody = await res.json()
      console.log('Resend response:', res.status, JSON.stringify(resBody))
      if (res.ok) emailSent = true
    } catch (err: any) {
      console.error('Resend error:', err?.message)
    }
  }

  return Response.json({
    success: true,
    emailSent,
    inviteUrl,
    message: emailSent
      ? `Invitation sent to ${cleanEmail}`
      : `Invitation created. Share this link: ${inviteUrl}`,
  }, { status: 201 })
})

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('invitations')
    .select('id, email, role, status, created_at, expires_at, token')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
  return Response.json({ invitations: data ?? [] })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)
    .eq('workspace_id', ctx.workspaceId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
})

function buildInviteHtml({ inviterName, workspaceName, role, inviteUrl, brandColor }: {
  inviterName: string; workspaceName: string; role: string; inviteUrl: string; brandColor: string
}) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">
<tr><td style="background:${brandColor};padding:28px 36px;">
  <div style="font-size:22px;font-weight:700;color:white;">WorkPulse</div>
</td></tr>
<tr><td style="padding:36px;">
  <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 16px;">You're invited to join ${workspaceName}</h2>
  <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
    <strong style="color:#e2e8f0;">${inviterName}</strong> invited you to join <strong style="color:#e2e8f0;">${workspaceName}</strong> as a <strong style="color:#e2e8f0;">${role}</strong>.
  </p>
  <div style="text-align:center;margin-bottom:28px;">
    <a href="${inviteUrl}" style="display:inline-block;background:${brandColor};color:white;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;text-decoration:none;">Accept Invitation →</a>
  </div>
  <p style="color:#475569;font-size:12px;margin:0 0 6px;">Or copy this link:</p>
  <p style="color:#6366f1;font-size:11px;word-break:break-all;background:rgba(99,102,241,0.08);padding:10px;border-radius:8px;margin:0 0 20px;">${inviteUrl}</p>
  <p style="color:#334155;font-size:11px;margin:0;">Expires in 7 days.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}