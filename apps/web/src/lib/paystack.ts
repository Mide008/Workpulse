// apps/web/src/lib/paystack.ts
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { proTotal, PRICE_USD } from '@/lib/plans'

const API = 'https://api.paystack.co'
export const paystackEnabled = () => !!process.env.PAYSTACK_SECRET_KEY
const currency = () => (process.env.PAYSTACK_CURRENCY ?? 'USD').toUpperCase()
/** If you charge in a non-USD currency set PAYSTACK_USD_RATE (units of that currency per 1 USD). */
const rate = () => (currency() === 'USD' ? 1 : Number(process.env.PAYSTACK_USD_RATE ?? 0))

export function quote(seats: number, interval: 'monthly' | 'annual') {
  const { charge } = proTotal(seats, interval)
  const r = rate()
  if (!r) throw new Error('PAYSTACK_USD_RATE must be set when PAYSTACK_CURRENCY is not USD')
  return { currency: currency(), amountMajor: Math.round(charge * r * 100) / 100, amountMinor: Math.round(charge * r * 100), usd: charge }
}

async function ps(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.status === false) throw new Error(json?.message ?? `Paystack error ${res.status}`)
  return json.data
}

export async function initializeCheckout(opts: { email: string; workspaceId: string; userId: string; seats: number; interval: 'monthly' | 'annual'; callbackUrl: string }) {
  const q = quote(opts.seats, opts.interval)
  const reference = `wp_${opts.workspaceId.replace(/-/g, '').slice(0, 10)}_${Date.now()}`
  const data = await ps('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: opts.email, amount: q.amountMinor, currency: q.currency, reference, callback_url: opts.callbackUrl,
      metadata: { workspace_id: opts.workspaceId, user_id: opts.userId, plan: 'pro', seats: opts.seats, interval: opts.interval, usd: q.usd, amount_minor: q.amountMinor },
    }),
  })
  return { url: data.authorization_url as string, reference, ...q }
}

export function verifySignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  try { return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature)) } catch { return false }
}

/** Idempotently activate Pro for a successful, verified Paystack transaction. */
export async function activateFromReference(reference: string): Promise<{ ok: boolean; message: string }> {
  const tx = await ps(`/transaction/verify/${encodeURIComponent(reference)}`)
  if (tx.status !== 'success') return { ok: false, message: `Payment ${tx.status ?? 'not completed'}` }
  const m = tx.metadata ?? {}
  if (!m.workspace_id || m.plan !== 'pro') return { ok: false, message: 'Unrecognised transaction' }
  if (Number(tx.amount) < Number(m.amount_minor)) return { ok: false, message: 'Amount mismatch' }

  const admin = createAdminClient() as any
  const { data: existing } = await admin.from('workspace_payments').select('id').eq('reference', reference).maybeSingle()
  if (existing) return { ok: true, message: 'Already applied' }

  const seats = Math.max(1, Number(m.seats) || 1)
  const interval: 'monthly' | 'annual' = m.interval === 'annual' ? 'annual' : 'monthly'
  const { data: ws } = await admin.from('workspaces').select('plan, plan_expires_at').eq('id', m.workspace_id).maybeSingle()
  const base = ws?.plan === 'pro' && ws?.plan_expires_at && new Date(ws.plan_expires_at) > new Date() ? new Date(ws.plan_expires_at) : new Date()
  const expires = new Date(base.getTime() + (interval === 'annual' ? 365 : 31) * 86400000)

  const { error: payErr } = await admin.from('workspace_payments').insert({
    workspace_id: m.workspace_id, reference, amount: tx.amount / 100, currency: tx.currency, usd_amount: m.usd ?? null,
    seats, interval, status: 'success', paid_by: m.user_id ?? null, paid_at: tx.paid_at ?? new Date().toISOString(),
  })
  if (payErr && !/duplicate/i.test(payErr.message)) return { ok: false, message: payErr.message }
  const { error } = await admin.from('workspaces').update({ plan: 'pro', plan_seats: seats, plan_expires_at: expires.toISOString(), plan_interval: interval, billing_email: tx.customer?.email ?? undefined }).eq('id', m.workspace_id)
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Plan activated' }
}
export { PRICE_USD }
