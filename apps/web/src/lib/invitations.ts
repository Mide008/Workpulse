// apps/web/src/lib/invitations.ts
// Single server-side implementation of: create, deliver, track, accept and join.
import { createAdminClient } from '@/lib/supabase/server'
import { effectivePlan, seatLimit } from '@/lib/plans'
import { validateEmailFormat, validateEmailDomain } from '@/lib/email-validation'
import { logActivity } from '@/lib/activity'
import type { AuthContext } from '@/lib/api-guard'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'
export const INVITE_DAYS = 7

export class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }
export const inviteLink = (token: string) => `${APP_URL}/invite?token=${token}`
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export function whatsappLink(opts: { workspaceName: string; inviterName: string; url: string }) {
  const text = `${opts.inviterName} invited you to join ${opts.workspaceName} on WorkPulse. Accept here: ${opts.url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

function buildInviteHtml(o: { inviterName: string; workspaceName: string; role: string; url: string; color: string }) {
  const n = esc(o.inviterName), w = esc(o.workspaceName), r = esc(o.role), c = /^#[0-9a-fA-F]{6}$/.test(o.color) ? o.color : '#6366F1'
  return `<!DOCTYPE html><html><body style="margin:0;background:#020617;font-family:-apple-system,Segoe UI,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden">
<tr><td style="background:${c};padding:24px 32px;color:#fff;font-size:20px;font-weight:700">WorkPulse</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 14px;color:#f8fafc;font-size:22px">Join ${w}</h2>
<p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6"><b style="color:#fff">${n}</b> invited you to join <b style="color:#fff">${w}</b> as <b style="color:#fff">${r}</b>. Create your password and you are in.</p>
<p style="text-align:center;margin:0 0 24px"><a href="${o.url}" style="display:inline-block;background:${c};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px">Accept invitation</a></p>
<p style="margin:0 0 6px;color:#94a3b8;font-size:12px">Or paste this link into your browser:</p>
<p style="margin:0 0 18px;color:#a5b4fc;font-size:12px;word-break:break-all">${o.url}</p>
<p style="margin:0;color:#64748b;font-size:12px">This invitation expires in ${INVITE_DAYS} days. If you were not expecting it, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`
}

export interface Delivery { emailSent: boolean; channel: 'resend' | 'smtp' | 'none'; error?: string }

/** Resend first, then SMTP. Never uses auth.admin.inviteUserByEmail, which pre-creates a password-less account and breaks acceptance. */
export async function deliverInvite(o: { to: string; inviterName: string; workspaceName: string; role: string; url: string; color: string }): Promise<Delivery> {
  const subject = `${o.inviterName} invited you to join ${o.workspaceName}`
  const html = buildInviteHtml(o)
  let lastError: string | undefined
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `WorkPulse <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`, to: [o.to], subject, html }),
      })
      if (res.ok) return { emailSent: true, channel: 'resend' }
      const j = await res.json().catch(() => ({}))
      lastError = j?.message ?? `Resend ${res.status}`
    } catch (e: any) { lastError = e?.message }
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const { sendEmail } = await import('@/lib/email')
      await sendEmail({ to: o.to, subject, html })
      return { emailSent: true, channel: 'smtp' }
    } catch (e: any) { lastError = e?.message }
  }
  return { emailSent: false, channel: 'none', error: lastError ?? 'No email provider configured' }
}

type Admin = ReturnType<typeof createAdminClient> & any

async function seatState(admin: Admin, workspaceId: string, ws: any, excludeEmail?: string) {
  const plan = effectivePlan(ws?.plan, ws?.plan_expires_at)
  const limit = seatLimit(plan, ws?.plan_seats)
  const { count: members } = await admin.from('users').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_active', true)
  let q = admin.from('invitations').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'pending').gt('expires_at', new Date().toISOString())
  if (excludeEmail) q = q.neq('email', excludeEmail)
  const { count: pending } = await q
  return { plan, limit, members: members ?? 0, pending: pending ?? 0 }
}

export async function createInvitation(ctx: AuthContext, input: { email: string; roleName?: string; roleId?: string; fullName?: string; jobTitle?: string }) {
  if (ctx.roleLevel > 2) throw new HttpError(403, 'Only managers and executives can invite people.')
  const email = input.email.toLowerCase().trim()
  const f = validateEmailFormat(email)
  if (!f.valid) throw new HttpError(400, f.error ?? 'Invalid email address')
  const d = await validateEmailDomain(email)
  if (!d.valid) throw new HttpError(400, d.error ?? 'That email domain does not look valid')

  const admin = createAdminClient() as Admin
  const [{ data: ws }, { data: roles }] = await Promise.all([
    admin.from('workspaces').select('name, primary_color, plan, plan_seats, plan_expires_at').eq('id', ctx.workspaceId).single(),
    admin.from('roles').select('id, name, level').eq('workspace_id', ctx.workspaceId),
  ])
  const list: any[] = roles ?? []
  const role = list.find(r => r.id === input.roleId) ?? list.find(r => r.name.toLowerCase() === (input.roleName ?? 'Staff').toLowerCase()) ?? list.find(r => r.level === 4)
  const roleName = role?.name ?? input.roleName ?? 'Staff'
  if (role && role.level < ctx.roleLevel) throw new HttpError(403, `You can only invite people at or below your own level (${roleName} is higher).`)

  const { data: member } = await admin.from('users').select('id').eq('workspace_id', ctx.workspaceId).ilike('email', email).maybeSingle()
  if (member) throw new HttpError(409, 'This person is already a member of your workspace.')

  const seats = await seatState(admin, ctx.workspaceId, ws, email)
  if (seats.members + seats.pending >= seats.limit) {
    throw new HttpError(402, `Your ${seats.plan === 'free' ? 'Starter' : 'current'} plan includes ${seats.limit} members (${seats.members} active + ${seats.pending} pending invites). Upgrade in Settings → Billing to add more.`)
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString()
  const base = { workspace_id: ctx.workspaceId, email, token, role: roleName, invited_by: ctx.userId, expires_at: expiresAt, status: 'pending' }
  const extras = { full_name: input.fullName?.trim() || null, job_title: input.jobTitle?.trim() || null, last_sent_at: new Date().toISOString(), resend_count: 0 }

  const { data: prior } = await admin.from('invitations').select('id').eq('workspace_id', ctx.workspaceId).eq('email', email).eq('status', 'pending').maybeSingle()
  let inv: any, err: any
  const write = async (payload: any) => prior
    ? admin.from('invitations').update(payload).eq('id', prior.id).select('*').single()
    : admin.from('invitations').insert(payload).select('*').single()
  ;({ data: inv, error: err } = await write({ ...base, ...extras }))
  if (err && /column|schema cache/i.test(err.message)) ({ data: inv, error: err } = await write(base))
  if (err || !inv) throw new HttpError(500, `Could not create the invitation: ${err?.message ?? 'unknown error'}`)

  try { await admin.rpc('mark_onboarding_step', { workspace_id_param: ctx.workspaceId, step_name: 'invited_member' }) } catch {}

  const url = inviteLink(token)
  const delivery = await deliverInvite({ to: email, inviterName: ctx.userFullName, workspaceName: ws?.name ?? 'WorkPulse', role: roleName, url, color: ws?.primary_color ?? '#6366F1' })
  await logActivity({ workspaceId: ctx.workspaceId, userId: ctx.userId, entityType: 'member', entityId: inv.id, entityTitle: email, action: 'member_invited', metadata: { actorName: ctx.userFullName, role: roleName } })

  return {
    invitation: inv, inviteUrl: url, ...delivery,
    whatsappUrl: whatsappLink({ workspaceName: ws?.name ?? 'WorkPulse', inviterName: ctx.userFullName, url }),
    message: delivery.emailSent ? `Invitation emailed to ${email}` : `Invitation created for ${email}. Email could not be sent (${delivery.error}). Share the link instead.`,
  }
}

export async function resendInvitation(ctx: AuthContext, id: string) {
  if (ctx.roleLevel > 2) throw new HttpError(403, 'Only managers and executives can resend invitations.')
  const admin = createAdminClient() as Admin
  const { data: inv } = await admin.from('invitations').select('*').eq('id', id).eq('workspace_id', ctx.workspaceId).maybeSingle()
  if (!inv) throw new HttpError(404, 'Invitation not found.')
  if (inv.status === 'accepted') throw new HttpError(409, 'This person has already joined.')
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString()
  let { error } = await admin.from('invitations').update({ status: 'pending', expires_at: expiresAt, last_sent_at: new Date().toISOString(), resend_count: (inv.resend_count ?? 0) + 1 }).eq('id', id)
  if (error && /column|schema cache/i.test(error.message)) ({ error } = await admin.from('invitations').update({ status: 'pending', expires_at: expiresAt }).eq('id', id))
  if (error) throw new HttpError(500, error.message)
  const { data: ws } = await admin.from('workspaces').select('name, primary_color').eq('id', ctx.workspaceId).single()
  const url = inviteLink(inv.token)
  const delivery = await deliverInvite({ to: inv.email, inviterName: ctx.userFullName, workspaceName: ws?.name ?? 'WorkPulse', role: inv.role, url, color: ws?.primary_color ?? '#6366F1' })
  return { inviteUrl: url, ...delivery, whatsappUrl: whatsappLink({ workspaceName: ws?.name ?? 'WorkPulse', inviterName: ctx.userFullName, url }) }
}

export async function revokeInvitation(ctx: AuthContext, id: string) {
  if (ctx.roleLevel > 2) throw new HttpError(403, 'Only managers and executives can revoke invitations.')
  const admin = createAdminClient() as Admin
  const { error } = await admin.from('invitations').update({ status: 'revoked' }).eq('id', id).eq('workspace_id', ctx.workspaceId).eq('status', 'pending')
  if (error) throw new HttpError(500, error.message)
}

/** Invitations with live status, inviter names and progress of people who joined. */
export async function listInvitations(workspaceId: string) {
  const admin = createAdminClient() as Admin
  const [{ data: invs }, { data: users }, { data: tasks }, { data: ws }] = await Promise.all([
    admin.from('invitations').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(500),
    admin.from('users').select('id, full_name, email, job_title, is_active, created_at, role:roles(name, level)').eq('workspace_id', workspaceId),
    admin.from('tasks').select('assigned_to, status, due_date').eq('workspace_id', workspaceId).is('deleted_at', null),
    admin.from('workspaces').select('plan, plan_seats, plan_expires_at').eq('id', workspaceId).single(),
  ])
  const byEmail = new Map<string, any>(((users ?? []) as any[]).map(u => [String(u.email).toLowerCase(), u]))
  const names = new Map<string, string>(((users ?? []) as any[]).map(u => [u.id, u.full_name]))
  const prog = new Map<string, { total: number; done: number; blocked: number; overdue: number }>()
  for (const t of (tasks ?? []) as any[]) {
    if (!t.assigned_to) continue
    const p = prog.get(t.assigned_to) ?? { total: 0, done: 0, blocked: 0, overdue: 0 }
    p.total++; if (t.status === 'done') p.done++; if (t.status === 'blocked') p.blocked++
    if (t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()) p.overdue++
    prog.set(t.assigned_to, p)
  }
  const now = Date.now()
  const rows = ((invs ?? []) as any[]).map(i => {
    const member = byEmail.get(String(i.email).toLowerCase())
    let state: 'pending' | 'expired' | 'joined' | 'revoked' = 'pending'
    if (i.status === 'accepted' || (member && member.is_active && i.status !== 'revoked')) state = 'joined'
    else if (i.status === 'revoked') state = 'revoked'
    else if (new Date(i.expires_at).getTime() < now) state = 'expired'
    const p = member ? prog.get(member.id) : undefined
    return {
      id: i.id, email: i.email, role: i.role, state, created_at: i.created_at, expires_at: i.expires_at,
      last_sent_at: i.last_sent_at ?? i.created_at, resend_count: i.resend_count ?? 0, accepted_at: i.accepted_at ?? (state === 'joined' ? member?.created_at : null),
      invited_by_name: names.get(i.invited_by) ?? 'Someone', full_name: i.full_name ?? member?.full_name ?? null,
      invite_url: state === 'pending' || state === 'expired' ? inviteLink(i.token) : null,
      member: member ? { id: member.id, full_name: member.full_name, job_title: member.job_title, joined_at: member.created_at, progress: p ?? { total: 0, done: 0, blocked: 0, overdue: 0 } } : null,
    }
  })
  const count = (s: string) => rows.filter(r => r.state === s).length
  const sent = rows.filter(r => r.state !== 'revoked').length
  const plan = effectivePlan(ws?.plan, ws?.plan_expires_at)
  const activeMembers = ((users ?? []) as any[]).filter(u => u.is_active).length
  return {
    invitations: rows,
    summary: { invited: sent, pending: count('pending'), joined: count('joined'), expired: count('expired'), revoked: count('revoked'), acceptanceRate: sent ? Math.round((count('joined') / sent) * 100) : 0 },
    seats: { used: activeMembers + count('pending'), members: activeMembers, limit: seatLimit(plan, ws?.plan_seats), plan },
  }
}

export async function lookupInvitation(token: string) {
  const admin = createAdminClient() as Admin
  const { data: inv } = await admin.from('invitations').select('id, email, role, status, expires_at, workspace_id, invited_by, full_name').eq('token', token).maybeSingle()
  if (!inv) return { valid: false as const, reason: 'not_found' }
  if (inv.status === 'accepted') return { valid: false as const, reason: 'used' }
  if (inv.status === 'revoked') return { valid: false as const, reason: 'revoked' }
  if (new Date(inv.expires_at) < new Date()) return { valid: false as const, reason: 'expired' }
  const [{ data: ws }, { data: inviter }] = await Promise.all([
    admin.from('workspaces').select('name, primary_color, logo_url').eq('id', inv.workspace_id).single(),
    admin.from('users').select('full_name').eq('id', inv.invited_by).maybeSingle(),
  ])
  const existing = await findAuthUserByEmail(admin, inv.email)
  return { valid: true as const, email: inv.email, role: inv.role, fullName: inv.full_name ?? '', workspaceName: ws?.name ?? 'WorkPulse', color: ws?.primary_color ?? '#6366F1', logo: ws?.logo_url ?? null, inviterName: inviter?.full_name ?? 'Your admin', expiresAt: inv.expires_at, hasAccount: !!existing?.last_sign_in_at }
}

export async function findAuthUserByEmail(admin: Admin, email: string) {
  const target = email.toLowerCase()
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return null
    const hit = data.users.find((u: any) => u.email?.toLowerCase() === target)
    if (hit) return hit
    if (data.users.length < 1000) break
  }
  return null
}

async function attach(admin: Admin, inv: any, userId: string, fullName: string) {
  const [{ data: ws }, { data: roles }] = await Promise.all([
    admin.from('workspaces').select('plan, plan_seats, plan_expires_at').eq('id', inv.workspace_id).single(),
    admin.from('roles').select('id, name, level').eq('workspace_id', inv.workspace_id),
  ])
  const { data: already } = await admin.from('users').select('id, workspace_id').eq('id', userId).maybeSingle()
  const seats = await seatState(admin, inv.workspace_id, ws)
  if (!(already && already.workspace_id === inv.workspace_id) && seats.members >= seats.limit) {
    throw new HttpError(402, 'This workspace has reached its member limit. Ask the admin to upgrade the plan, then try again.')
  }
  const list: any[] = roles ?? []
  const role = list.find(r => r.name.toLowerCase() === String(inv.role).toLowerCase()) ?? list.find(r => r.level === 4)
  const email = inv.email.toLowerCase()
  const profile: any = { id: userId, workspace_id: inv.workspace_id, role_id: role?.id ?? null, full_name: fullName || inv.full_name || email.split('@')[0], email, is_active: true }
  if (inv.job_title) profile.job_title = inv.job_title
  const { error: pErr } = await admin.from('users').upsert(profile)
  if (pErr) throw new HttpError(500, `Could not create your profile: ${pErr.message}`)

  let { error } = await admin.from('invitations').update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by: userId }).eq('id', inv.id)
  if (error && /column|schema cache/i.test(error.message)) ({ error } = await admin.from('invitations').update({ status: 'accepted' }).eq('id', inv.id))
  if (error) console.error('[invite] mark accepted failed:', error.message)

  try {
    await admin.from('activity_logs').insert({ workspace_id: inv.workspace_id, user_id: userId, entity_type: 'member', entity_id: userId, entity_title: profile.full_name, action: 'member_joined', metadata: { role: role?.name } })
    const { data: mgrs } = await admin.from('users').select('id, role:roles(level)').eq('workspace_id', inv.workspace_id)
    const notify = new Set<string>([inv.invited_by, ...((mgrs ?? []) as any[]).filter(m => (m.role?.level ?? 4) <= 2).map(m => m.id)])
    notify.delete(userId)
    if (notify.size) await admin.from('notifications').insert([...notify].map(uid => ({ workspace_id: inv.workspace_id, user_id: uid, entity_type: 'member', entity_id: userId, type: 'success', title: `${profile.full_name} accepted the invitation and joined`, link: '/team/invitations', read: false })))
  } catch (e) { console.error('[invite] notify failed', e) }
}

export async function acceptInvitation(token: string, password: string, fullName: string) {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) throw new HttpError(400, 'Password needs 8+ characters, one uppercase letter and one number.')
  const admin = createAdminClient() as Admin
  const { data: inv } = await admin.from('invitations').select('*').eq('token', token).eq('status', 'pending').maybeSingle()
  if (!inv || new Date(inv.expires_at) < new Date()) throw new HttpError(410, 'This invitation is invalid or has expired. Ask your admin to resend it.')

  const email = inv.email.toLowerCase()
  const name = fullName.trim() || inv.full_name || email.split('@')[0]
  const existing = await findAuthUserByEmail(admin, email)
  let userId: string

  if (existing) {
    // A real account that has signed in before must authenticate; never overwrite its password.
    if (existing.last_sign_in_at) return { requiresLogin: true as const, email }
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { full_name: name } })
    if (error) throw new HttpError(500, error.message)
    userId = existing.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } })
    if (error || !data.user) throw new HttpError(500, error?.message ?? 'Could not create your account')
    userId = data.user.id
  }
  await attach(admin, inv, userId, name)
  return { requiresLogin: false as const, email }
}

export async function joinWithSession(token: string, user: { id: string; email?: string | null }) {
  const admin = createAdminClient() as Admin
  const { data: inv } = await admin.from('invitations').select('*').eq('token', token).eq('status', 'pending').maybeSingle()
  if (!inv || new Date(inv.expires_at) < new Date()) throw new HttpError(410, 'This invitation is invalid or has expired.')
  if (!user.email || user.email.toLowerCase() !== inv.email.toLowerCase()) throw new HttpError(403, `This invitation is for ${inv.email}. Sign in with that email address.`)
  await attach(admin, inv, user.id, '')
}
