// apps/web/src/app/(app)/approvals/approvals-client.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, DollarSign, Calendar, ShoppingBag, ChevronDown, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { staggerContainer, staggerItem, scalePop, blurReveal, ease } from '@/lib/motion'

const TYPES = [
  { value: 'leave',    label: 'Leave request',    icon: Calendar,    color: '#6366F1' },
  { value: 'expense',  label: 'Expense claim',    icon: DollarSign,  color: '#10B981' },
  { value: 'purchase', label: 'Purchase order',   icon: ShoppingBag, color: '#F59E0B' },
  { value: 'document', label: 'Document sign-off',icon: FileText,    color: '#8B5CF6' },
  { value: 'other',    label: 'Other',            icon: AlertTriangle,color:'#64748B' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   icon: Clock        },
  approved: { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)',   icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    icon: XCircle      },
}

export default function ApprovalsClient({ user }: { user: any }) {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'inbox' | 'mine'>('inbox')
  const [showNew, setShowNew]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [acting, setActing]       = useState<string | null>(null)
  const [form, setForm] = useState({ type: 'leave', title: '', description: '', amount: '', startDate: '', endDate: '' })
  const isManager = user.roleLevel <= 2

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = tab === 'mine' ? '?mine=1' : ''
      const res = await fetch(`/api/approvals${qs}`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : []
      setApprovals(Array.isArray(data) ? data : [])
    } catch {
      setApprovals([])
    }
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSubmitting(true)
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        description: form.description || null,
        amount: form.amount ? parseFloat(form.amount) : null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to submit')
      setSubmitting(false)
      return
    }
    toast.success('Request submitted')
    setShowNew(false)
    setForm({ type:'leave', title:'', description:'', amount:'', startDate:'', endDate:'' })
    await load()
    setSubmitting(false)
  }

  async function act(id: string, status: 'approved' | 'rejected') {
    setActing(id)
    const res = await fetch(`/api/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed')
    } else {
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      await load()
    }
    setActing(null)
  }

  const inp = `w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all
    bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]
    focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_15%,transparent)]`
  const lbl = `block text-sm font-medium mb-1.5 text-[var(--text-secondary)]`

  const pending = approvals.filter(a => a.status === 'pending')
  const processed = approvals.filter(a => a.status !== 'pending')

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Approvals</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {pending.length} pending · {isManager ? 'You can approve requests' : 'Track your requests'}
          </p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background:'var(--primary)', boxShadow:'0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)' }}>
          <Plus className="w-4 h-4" /> New request
        </motion.button>
      </motion.div>

      {isManager && (
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background:'var(--bg-elevated)' }}>
          {[['inbox','Team inbox'],['mine','My requests']].map(([v,l]) => (
            <motion.button key={v} onClick={() => setTab(v as any)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={tab===v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text-secondary)' }}>
              {l}
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNew && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
            <motion.div variants={scalePop} initial="initial" animate="animate" exit="exit"
              className="relative w-full max-w-lg rounded-2xl border shadow-2xl"
              style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
              <div className="p-5 border-b" style={{ borderColor:'var(--border)' }}>
                <h2 className="font-bold text-[var(--text-primary)]">New approval request</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Notify managers for in-app approval</p>
              </div>
              <form onSubmit={submit} className="p-5 space-y-4">
                <div>
                  <label className={lbl}>Request type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TYPES.map(t => (
                      <motion.button key={t.value} type="button" whileTap={{ scale:0.96 }}
                        onClick={() => setForm(f => ({ ...f, type:t.value }))}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                        style={form.type===t.value
                          ? { background:`${t.color}15`, borderColor:`${t.color}40`, color:t.color }
                          : { background:'var(--bg-elevated)', borderColor:'var(--border)', color:'var(--text-secondary)' }}>
                        <t.icon className="w-4 h-4 shrink-0" />{t.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Title *</label>
                  <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                    placeholder="Brief description of what you need approved" required className={inp} />
                </div>
                <div>
                  <label className={lbl}>Details</label>
                  <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                    placeholder="Add context, links, or supporting information…" rows={3}
                    className={`${inp} h-auto py-3 resize-none`} />
                </div>
                {(form.type === 'leave') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>From</label><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={inp}/></div>
                    <div><label className={lbl}>To</label><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={inp}/></div>
                  </div>
                )}
                {(form.type === 'expense' || form.type === 'purchase') && (
                  <div>
                    <label className={lbl}>Amount</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                      placeholder="0.00" className={inp} />
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <motion.button type="submit" disabled={submitting} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background:'var(--primary)' }}>
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Submitting…</> : <><Send className="w-4 h-4"/>Submit request</>}
                  </motion.button>
                  <button type="button" onClick={() => setShowNew(false)}
                    className="px-5 h-11 rounded-xl border text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all"
                    style={{ borderColor:'var(--border)' }}>Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
        </div>
      ) : approvals.length === 0 ? (
        <motion.div variants={blurReveal} initial="initial" animate="animate"
          className="text-center py-20 rounded-2xl border" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)] mb-1">No requests yet</p>
          <p className="text-sm text-[var(--text-muted)]">Submit a request and it will appear here for approval.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Pending · {pending.length}</p>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {pending.map(a => <ApprovalCard key={a.id} approval={a} user={user} isManager={isManager} acting={acting} onAct={act} />)}
              </motion.div>
            </div>
          )}
          {processed.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Processed · {processed.length}</p>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {processed.map(a => <ApprovalCard key={a.id} approval={a} user={user} isManager={false} acting={acting} onAct={act} />)}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ approval: a, user, isManager, acting, onAct }: any) {
  const [expanded, setExpanded] = useState(false)
  const t = TYPES.find(t => t.value === a.type) ?? TYPES[4]
  const s = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending
  const canAct = isManager && a.status === 'pending' && a.requester_id !== user.id

  return (
    <motion.div
      variants={{ hidden:{ opacity:0,y:16 }, visible:{ opacity:1,y:0,transition:{ duration:0.4,ease:[0.19,1,0.22,1] } } }}
      className="rounded-2xl border overflow-hidden transition-all"
      style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${t.color}15` }}>
            <t.icon className="w-4 h-4" style={{ color:t.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-[var(--text-primary)] text-sm">{a.title}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background:s.bg, color:s.color }}>
                <s.icon className="w-3 h-3" />{s.label}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {a.requester?.full_name ?? 'Unknown'} · {a.requester?.role ?? ''} ·{' '}
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
            </p>
            {a.amount && (
              <p className="text-sm font-bold mt-1" style={{ color:t.color }}>
                ₦{parseFloat(a.amount).toLocaleString()}
              </p>
            )}
            {(a.start_date || a.end_date) && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {a.start_date} {a.end_date ? `→ ${a.end_date}` : ''}
              </p>
            )}
          </div>
          {a.description && (
            <button onClick={() => setExpanded(v=>!v)} className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </motion.div>
            </button>
          )}
        </div>
        <AnimatePresence>
          {expanded && a.description && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              className="overflow-hidden">
              <p className="text-sm text-[var(--text-secondary)] mt-3 pt-3 border-t leading-relaxed"
                style={{ borderColor:'var(--border)' }}>{a.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {canAct && (
          <div className="flex gap-2 mt-4">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => onAct(a.id, 'approved')} disabled={acting===a.id}
              className="flex-1 h-9 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background:'#10B981' }}>
              {acting===a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}Approve
            </motion.button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={() => onAct(a.id, 'rejected')} disabled={acting===a.id}
              className="flex-1 h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)' }}>
              <XCircle className="w-3.5 h-3.5"/>Reject
            </motion.button>
          </div>
        )}
        {a.status !== 'pending' && a.reviewer?.full_name && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            {a.status === 'approved' ? '✓ Approved' : '✗ Rejected'} by {a.reviewer.full_name}
          </p>
        )}
      </div>
    </motion.div>
  )
}