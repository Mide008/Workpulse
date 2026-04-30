import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
})

export const POST = withAuth(
  async (req, ctx) => {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    // Check for duplicate pending invite
    const { data: existing } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('workspace_id', ctx.workspaceId)
      .eq('email', parsed.data.email)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return Response.json({ error: 'Invitation already sent to this email' }, { status: 409 })
    }

    // Create invitation
    const { data: invite, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: ctx.workspaceId,
        email: parsed.data.email,
        role_id: parsed.data.roleId,
        team_id: parsed.data.teamId,
        invited_by: ctx.userId,
      })
      .select('*, workspace:workspaces(name), invited_by_user:users(full_name)')
      .single()

    if (error) throw error

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${invite.token}`
    await resend.emails.send({
      from: 'WorkPulse <noreply@workpulse.io>',
      to: parsed.data.email,
      subject: `You've been invited to join ${(invite.workspace as any).name} on WorkPulse`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2>You have been invited</h2>
          <p>${(invite.invited_by_user as any).full_name} has invited you to join
            <strong>${(invite.workspace as any).name}</strong> on WorkPulse.</p>
          <a href="${inviteUrl}"
            style="display:inline-block;background:#6366F1;color:#fff;
              padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Accept invitation
          </a>
          <p style="color:#6B7280;font-size:13px;margin-top:24px">
            This link expires in 7 days. If you weren't expecting this, ignore this email.
          </p>
        </div>
      `,
    })

    return Response.json({ success: true })
  },
  { permission: 'manage_members' }
)