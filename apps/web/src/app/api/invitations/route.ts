import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import type { NextRequest } from 'next/server'

const schema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
})

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check for duplicate pending invite
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('email', parsed.data.email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return Response.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      )
    }

    // Create invitation record
    const { data: invite, error: insertError } = await supabase
      .from('invitations')
      .insert({
        workspace_id: ctx.workspaceId,
        email: parsed.data.email,
        role_id: parsed.data.roleId,
        team_id: parsed.data.teamId,
        invited_by: ctx.userId,
      })
      .select('id, token')
      .single()

    if (insertError || !invite) {
      console.error('[Invitations] Insert error:', insertError)
      return Response.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Fetch workspace name and inviter name separately to avoid join typing issues
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', ctx.workspaceId)
      .single()

    const { data: inviterData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', ctx.userId)
      .single()

    const workspaceName = (workspaceData as { name: string } | null)?.name ?? 'a workspace'
    const inviterName = (inviterData as { full_name: string } | null)?.full_name ?? 'A team member'
    const inviteToken = (invite as { id: string; token: string }).token
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${inviteToken}`

    // Send email
    try {
      const transporter = createTransporter()
      await transporter.sendMail({
        from: `"WorkPulse" <${process.env.SMTP_USER}>`,
        to: parsed.data.email,
        subject: `You have been invited to join ${workspaceName} on WorkPulse`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 0">
            <div style="text-align:center;margin-bottom:32px">
              <div style="display:inline-flex;align-items:center;gap:8px">
                <div style="width:36px;height:36px;background:#6366F1;border-radius:8px;
                  display:flex;align-items:center;justify-content:center">
                </div>
                <span style="font-size:20px;font-weight:700;color:#111">WorkPulse</span>
              </div>
            </div>
            <h2 style="font-size:24px;font-weight:700;color:#111;margin:0 0 12px">
              You have been invited
            </h2>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px">
              ${inviterName} has invited you to join <strong>${workspaceName}</strong> on WorkPulse
              — a team operating system for tracking tasks, KPIs, and collaboration.
            </p>
            <a href="${inviteUrl}"
              style="display:inline-block;background:#6366F1;color:#fff;padding:14px 28px;
                border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              Accept invitation
            </a>
            <p style="color:#999;font-size:13px;margin-top:32px">
              This invitation expires in 7 days. If you were not expecting this, you can safely
              ignore this email.
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[Invitations] Email send error:', emailErr)
      // Do not fail the request — invite is created, email is best-effort
    }

    return Response.json({ success: true })
  },
  { permission: 'manage_members' }
)