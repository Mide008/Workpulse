// apps/web/src/app/(app)/approvals/approvals-client.tsx
'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock, DollarSign, FileText, KeyRound, Loader2, Plus, Send, ShoppingBag, Trash2, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ease, spring } from '@/lib/motion'
import AnimatedCounter from '@/components/motion/animated-counter'

const TYPES = [
  { value: 'leave', label: 'Leave', icon: Calendar, color: '#818CF8' },
  { value: 'expense', label: 'Expense', icon: DollarSign, color: '#34D399' },
  { value: 'purchase', label: 'Purchase', icon: ShoppingBag, color: '#FBBF24' },
  { value: 'document', label: 'Document sign-off', icon: FileText, color: '#A78BFA' },
  { value: 'access', label: 'Access or tool', icon: KeyRound, color: '#22D3EE' },
  { value: 'other', label: 'Other decision', icon: AlertTriangle, color: '#94A3B8' },
]
const STATUS = {
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,.14)', icon: Clock },
  approved: { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,.14)', icon: CheckCircle2 },
  rejected: { label: 'Declined', color: '#EF4444', bg: 'rgba(239,68,68,.14)', icon: XCircle },
} as const
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR', 'INR', 'AED', 'CAD', 'AUD', 'SGD']

const fieldCls = 'w-full h-11 px-4 rounded-xl border text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition-all'
const money = (n: any, c = 'USD') => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(Number(n)) } catch { return `${c} ${n}` } }

function Initials({ name }: { name?: string }) {
  const t = (name ?? '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
  return <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>{t}</span>
}

export default function ApprovalsClient({ user }: { user: { id: string; fullName: string; roleLevel: number } }) {
  const isManager = user.roleLevel <= 2
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'review' | 'all' | 'mine'>(isManager ? 'review' : 'mine')
  const [showNew, setShowNew] = useState(false)
  const [freshId, setFreshId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/approvals', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Could not load approvals')
      setItems(json.approvals ?? [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const visible = useMemo(() => items.filter(a => tab === 'mine' ? a.requester_id === user.id : tab === 'review' ? a.status === 'pending' : true), [items, tab, user.id])
  const counts = useMemo(() => ({
    pending: items.filter(a => a.status === 'pending').length,
    approved: items.filter(a => a.status === 'approved').length,
    rejected: items.filter(a => a.status === 'rejected').length,
    review: items.filter(a => a.status === 'pending').length,
  }), [items, user.id])

  async function decide(id: string, status: 'approved' | 'rejected', note?: string) {
    const prev = items
    setItems(items.map(a => (a.id === id ? { ...a, status, reviewer: { full_name: user.fullName }, reviewed_at: new Date().toISOString() } : a)))
    const res = await fetch(`/api/approvals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, note }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setItems(prev); toast.error(json?.error ?? 'Could not save your decision'); return }
    setItems(cur => cur.map(a => (a.id === id ? json.approval : a)))
    toast.success(status === 'approved' ? 'Approved. The requester has been notified.' : 'Declined. The requester has been notified.')
  }
  async function cancel(id: string) {
    const prev = items
    setItems(items.filter(a => a.id !== id))
    const res = await fetch(`/api/approvals/${id}`, { method: 'DELETE' })
    if (!res.ok) { setItems(prev); toast.error('Could not cancel this request'); return }
    toast.success('Request cancelled')
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Approvals</h1>
          <p className="text-[15px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isManager ? 'Review what your team needs, or raise your own request.' : 'Raise a request and track it here. Your manager is notified instantly.'}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setShowNew(true)}
          className="btn-shine h-11 px-5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 8px 22px rgba(99,102,241,.35)' }}>
          <Plus className="w-4 h-4" />New request
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {([['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Declined']] as const).map(([k, l], i) => {
          const s = STATUS[k]
          return (
            <motion.div key={k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, ease: ease.expo }}
              className="rounded-2xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}><s.icon className="w-4 h-4" style={{ color: s.color }} /></span>
              <p className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: s.color }}><AnimatedCounter value={counts[k]} /></p>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{l}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-5 w-full sm:w-fit overflow-x-auto" style={{ background: 'var(--bg-elevated)' }} role="tablist">
        {([...(isManager ? [['review', `Needs review${counts.review ? ` (${counts.review})` : ''}`], ['all', 'Everything']] : []), ['mine', 'My requests']] as [string, string][]).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v as any)}
            className="relative px-4 h-10 rounded-lg text-sm font-semibold whitespace-nowrap" style={{ color: tab === v ? '#fff' : 'var(--text-secondary)' }}>
            {tab === v && <motion.span layoutId="appr-tab" className="absolute inset-0 rounded-lg" style={{ background: 'var(--primary)' }} transition={spring.snappy} />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="min-w-0"><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Approvals could not load</p><p className="text-sm mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button onClick={() => { setLoading(true); load() }} className="mt-3 text-sm font-bold underline" style={{ color: 'var(--primary)' }}>Try again</button></div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}</div>
      ) : visible.length === 0 && !error ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{tab === 'review' ? 'Nothing waiting for you' : 'No requests yet'}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{tab === 'review' ? 'New requests from your team will appear here.' : 'Tap “New request” to submit your first one.'}</p>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map(a => <ApprovalCard key={a.id} a={a} me={user} isManager={isManager} fresh={freshId === a.id} onDecide={decide} onCancel={cancel} />)}
          </AnimatePresence>
        </ul>
      )}

      <NewRequestSheet open={showNew} onClose={() => setShowNew(false)} onCreated={a => { setItems(cur => [a, ...cur]); setFreshId(a.id); setTab('mine'); setTimeout(() => setFreshId(null), 3500) }} />
    </div>
  )
}

function ApprovalCard({ a, me, isManager, fresh, onDecide, onCancel }: any) {
  const [open, setOpen] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const t = TYPES.find(x => x.value === a.type) ?? TYPES[5]
  const s = (STATUS as any)[a.status] ?? STATUS.pending
  const canReview = isManager && a.status === 'pending' && a.requester_id !== me.id
  const mine = a.requester_id === me.id

  async function act(status: 'approved' | 'rejected') { setBusy(true); await onDecide(a.id, status, note); setBusy(false); setDeclining(false) }

  return (
    <motion.li layout initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: ease.expo }}
      className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: fresh ? 'var(--primary)' : 'var(--border)', boxShadow: fresh ? '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)' : 'none' }}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${t.color}22` }}><t.icon className="w-5 h-5" style={{ color: t.color }} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[15px] sm:text-base break-words" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}><s.icon className="w-3 h-3" />{s.label}</span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {mine ? 'You' : a.requester?.full_name ?? 'Someone'} · {t.label} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
            </p>
            {a.amount != null && <p className="text-lg font-black mt-1.5" style={{ color: t.color }}>{money(a.amount, a.currency ?? 'USD')}</p>}
            {(a.start_date || a.end_date) && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{a.start_date}{a.end_date ? ` → ${a.end_date}` : ''}</p>}
          </div>
          {a.description && (
            <button onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Toggle details" className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)]">
              <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /></motion.span>
            </button>
          )}
        </div>
        <AnimatePresence>{open && a.description && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-sm leading-relaxed mt-3 pt-3 border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>{a.description}</motion.p>
        )}</AnimatePresence>

        {canReview && (
          <div className="mt-4">
            <AnimatePresence initial={false}>{declining && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a reason (optional)" className="w-full px-4 py-3 rounded-xl border text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
              </motion.div>
            )}</AnimatePresence>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => act('approved')} className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: '#10B981' }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Approve
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => (declining ? act('rejected') : setDeclining(true))} className="flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'rgba(239,68,68,.14)', color: '#F87171', border: '1px solid rgba(239,68,68,.35)' }}>
                <XCircle className="w-4 h-4" />{declining ? 'Confirm decline' : 'Decline'}
              </motion.button>
            </div>
          </div>
        )}
        {mine && a.status === 'pending' && (
          <button onClick={() => onCancel(a.id)} className="mt-3 text-sm font-semibold inline-flex items-center gap-1.5 min-h-[40px]" style={{ color: 'var(--text-secondary)' }}><Trash2 className="w-4 h-4" />Cancel request</button>
        )}
        {a.status !== 'pending' && a.reviewer?.full_name && (
          <p className="text-sm mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            {a.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
            {a.status === 'approved' ? 'Approved' : 'Declined'} by <strong className="text-[var(--text-primary)]">{a.reviewer.full_name}</strong>
            {a.reviewed_at ? <span className="text-xs text-[var(--text-muted)] italic">· {formatDistanceToNow(new Date(a.reviewed_at), { addSuffix: true })}</span> : null}
            {a.review_note ? ` · “${a.review_note}”` : ''}
          </p>
        )}
      </div>
    </motion.li>
  )
}

function NewRequestSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: any) => void }) {
  const blank = { type: 'leave', title: '', description: '', amount: '', currency: 'USD', startDate: '', endDate: '' }
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  const needsDates = f.type === 'leave', needsAmount = f.type === 'expense' || f.type === 'purchase'

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (f.title.trim().length < 3) { setErr('Please enter a short title (3+ characters).'); return }
    setBusy(true)
    const res = await fetch('/api/approvals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setErr(json?.error ?? 'Could not submit your request'); return }
    toast.success('Request submitted. Your managers have been notified.')
    onCreated(json.approval); setF(blank); onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }} transition={spring.smooth}
            role="dialog" aria-modal="true" aria-label="New approval request"
            className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div><h2 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>New request</h2><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your managers are notified instantly.</p></div>
              <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-elevated)]"><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('type', t.value)} aria-pressed={f.type === t.value}
                    className="min-h-[48px] px-3 rounded-xl border text-sm font-semibold flex items-center gap-2 text-left transition-colors"
                    style={f.type === t.value ? { background: `${t.color}22`, borderColor: t.color, color: t.color } : { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <t.icon className="w-4 h-4 shrink-0" />{t.label}
                  </button>
                ))}
              </div>
              <div><label htmlFor="ap-title" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Title</label>
                <input id="ap-title" value={f.title} onChange={e => set('title', e.target.value)} placeholder="What do you need approved?" className={fieldCls} autoFocus /></div>
              <div><label htmlFor="ap-desc" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Details <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea id="ap-desc" value={f.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Add context, links or supporting information" className="w-full px-4 py-3 rounded-xl border text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40" /></div>
              {needsDates && <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>From</label><input type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} className={fieldCls} /></div>
                <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>To</label><input type="date" value={f.endDate} min={f.startDate} onChange={e => set('endDate', e.target.value)} className={fieldCls} /></div></div>}
              {needsAmount && <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Amount</label><input type="number" inputMode="decimal" min="0" step="0.01" value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" className={fieldCls} /></div>
                <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Currency</label><select value={f.currency} onChange={e => set('currency', e.target.value)} className={fieldCls}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div></div>}
              {err && <p role="alert" className="text-sm font-semibold rounded-xl p-3 break-words" style={{ background: 'rgba(239,68,68,.12)', color: '#F87171' }}>{err}</p>}
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={busy} className="btn-shine w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit request</>}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}