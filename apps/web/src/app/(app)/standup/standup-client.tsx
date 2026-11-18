// apps/web/src/app/(app)/standup/standup-client.tsx
'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Edit3, Loader2, Plus, Send, Trash2, TrendingUp, Users, X,
} from 'lucide-react'
import { addDays, format, isSameDay, subDays } from 'date-fns'
import { toast } from 'sonner'
import { ease, spring } from '@/lib/motion'
import AnimatedCounter from '@/components/motion/animated-counter'

const area = 'w-full px-4 py-3 rounded-xl border text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all'

function Initials({ name }: { name?: string }) {
  const t = (name ?? '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span
      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)', color: 'var(--primary)' }}
    >
      {t}
    </span>
  )
}

type FormMode = 'hidden' | 'new' | 'edit'

export default function StandupClient({
  user,
}: {
  user: { id: string; fullName: string; roleLevel: number }
}) {
  const [date, setDate] = useState(() => new Date())
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('hidden')
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState({
    did: '', doing: '', blockers: '', leads_added: '', leads_converted: '',
  })
  const isToday = isSameDay(date, new Date())
  const dateStr = format(date, 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/standup?date=${dateStr}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Could not load the work log')
      setLogs(json.logs ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setFormMode('hidden')
    setEditId(null)
    setFormErr(null)
    setF({ did: '', doing: '', blockers: '', leads_added: '', leads_converted: '' })
  }, [dateStr])

  const myLogs = useMemo(
    () => logs.filter(l => l.user_id === user.id),
    [logs, user.id]
  )

  useEffect(() => {
    if (!loading && isToday && myLogs.length === 0 && formMode === 'hidden') {
      setFormMode('new')
    }
  }, [loading, isToday, myLogs.length, formMode])

  const totals = useMemo(() => ({
    logged: logs.length,
    added: logs.reduce((s, l) => s + (l.leads_added || 0), 0),
    converted: logs.reduce((s, l) => s + (l.leads_converted || 0), 0),
    blockers: logs.filter(l => l.blockers?.trim()).length,
  }), [logs])

  function resetForm() {
    setF({ did: '', doing: '', blockers: '', leads_added: '', leads_converted: '' })
    setFormErr(null)
  }

  function openNew() {
    resetForm()
    setEditId(null)
    setFormMode('new')
  }

  function openEdit(log: any) {
    setF({
      did: log.did ?? '',
      doing: log.doing ?? '',
      blockers: log.blockers ?? '',
      leads_added: log.leads_added ? String(log.leads_added) : '',
      leads_converted: log.leads_converted ? String(log.leads_converted) : '',
    })
    setEditId(log.id)
    setFormErr(null)
    setFormMode('edit')
  }

  function cancelForm() {
    setFormMode('hidden')
    setEditId(null)
    resetForm()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormErr(null)
    if (f.did.trim().length < 3) {
      setFormErr('Tell us what you did (at least a few words).')
      return
    }
    setBusy(true)
    
    const payload = {
      ...f,
      leads_added: f.leads_added ? Number(f.leads_added) : 0,
      leads_converted: f.leads_converted ? Number(f.leads_converted) : 0,
      logDate: dateStr
    }

    const url = formMode === 'edit' && editId ? `/api/standup/${editId}` : '/api/standup'
    const method = formMode === 'edit' ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setFormErr(json?.error ?? 'Could not save your log')
      return
    }
    await load()
    setFormMode('hidden')
    setEditId(null)
    resetForm()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3500)
    toast.success(formMode === 'edit' ? 'Log updated.' : 'Work log saved.')
  }

  async function del(id: string) {
    if (!confirm('Delete this log? This cannot be undone.')) return
    const res = await fetch(`/api/standup/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j?.error ?? 'Could not delete log')
      return
    }
    setLogs(cur => cur.filter(l => l.id !== id))
    toast.success('Log deleted')
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Work Log</h1>
          <p className="text-[15px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isToday ? 'What the team is doing today' : format(date, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          <button onClick={() => setDate(d => subDays(d, 1))} aria-label="Previous day" className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--bg-surface)]">
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          </button>
          <button onClick={() => setDate(new Date())} className="px-3 h-10 rounded-lg text-sm font-bold" style={{ color: isToday ? 'var(--primary)' : 'var(--text-primary)' }}>
            {isToday ? 'Today' : format(date, 'd MMM')}
          </button>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={isToday} aria-label="Next day" className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Logged', v: totals.logged, i: Users, c: '#818CF8' },
          { l: 'Leads added', v: totals.added, i: TrendingUp, c: '#34D399' },
          { l: 'Converted', v: totals.converted, i: CheckCircle2, c: '#60A5FA' },
          { l: 'Blockers', v: totals.blockers, i: AlertTriangle, c: '#F87171' },
        ].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: ease.expo }} whileHover={{ y: -3 }}
            className="rounded-2xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.c}22` }}>
              <s.i className="w-4 h-4" style={{ color: s.c }} />
            </span>
            <p className="text-3xl font-black tabular-nums" style={{ color: s.c }}><AnimatedCounter value={s.v} /></p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{s.l}</p>
          </motion.div>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>The work log could not load</p>
            <p className="text-sm mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button onClick={load} className="mt-3 text-sm font-bold underline" style={{ color: 'var(--primary)' }}>Try again</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* LEFT PANEL — my logs */}
        <section className="lg:col-span-2 rounded-2xl border overflow-hidden self-start" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {formMode === 'edit' ? 'Edit log' : formMode === 'new' ? 'New log' : 'My logs'}
              {formMode === 'hidden' && myLogs.length > 0 && (
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
                  {myLogs.length}
                </span>
              )}
            </h2>
            {formMode === 'hidden' && isToday && (
              <button onClick={openNew} className="inline-flex items-center gap-1.5 text-sm font-bold min-h-[36px] px-3 rounded-lg" style={{ color: 'var(--primary)' }}>
                <Plus className="w-4 h-4" />Add another
              </button>
            )}
            {formMode !== 'hidden' && (
              <button onClick={cancelForm} className="inline-flex items-center gap-1.5 text-sm font-bold min-h-[36px] px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                <X className="w-4 h-4" />Cancel
              </button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {formMode !== 'hidden' ? (
              <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                <div>
                  <label htmlFor="wl-did" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>What did you do?</label>
                  <textarea id="wl-did" rows={4} value={f.did} onChange={e => setF({ ...f, did: e.target.value })} placeholder="Summarise what you completed or worked on" className={area} />
                </div>
                <div>
                  <label htmlFor="wl-next" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>What is next?</label>
                  <textarea id="wl-next" rows={2} value={f.doing} onChange={e => setF({ ...f, doing: e.target.value })} placeholder="Plan for tomorrow" className={area} />
                </div>
                <div>
                  <label htmlFor="wl-block" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Blockers <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <textarea id="wl-block" rows={2} value={f.blockers} onChange={e => setF({ ...f, blockers: e.target.value })} placeholder="Anything slowing you down?" className={area} />
                </div>
                
                <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Optional (Sales/Marketing)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="wl-la" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Leads added</label>
                      <input id="wl-la" type="number" inputMode="numeric" min="0" value={f.leads_added} onChange={e => setF({ ...f, leads_added: e.target.value })} placeholder="0" className="w-full h-11 px-4 rounded-xl border text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                    </div>
                    <div>
                      <label htmlFor="wl-lc" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Converted</label>
                      <input id="wl-lc" type="number" inputMode="numeric" min="0" value={f.leads_converted} onChange={e => setF({ ...f, leads_converted: e.target.value })} placeholder="0" className="w-full h-11 px-4 rounded-xl border text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                    </div>
                  </div>
                </div>

                {formErr && (
                  <p role="alert" className="text-sm font-semibold rounded-xl p-3 break-words" style={{ background: 'rgba(239,68,68,.12)', color: '#F87171' }}>{formErr}</p>
                )}
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={busy} className="btn-shine w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'var(--primary)' }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Send className="w-4 h-4" />{formMode === 'edit' ? 'Update log' : 'Submit log'}</>}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                <AnimatePresence>{justSaved && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: 'rgba(16,185,129,.14)', color: '#34D399' }}>
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.bouncy}><CheckCircle2 className="w-5 h-5" /></motion.span>
                    <span className="text-sm font-bold">Saved. Your team can see this now.</span>
                  </motion.div>
                )}</AnimatePresence>

                {myLogs.length === 0 ? (
                  <p className="p-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isToday ? 'No log yet — add one above.' : 'No log from you on this day.'}
                  </p>
                ) : (
                  myLogs.map(log => (
                    <motion.div key={log.id} layout className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(log.updated_at), 'h:mm a')}</span>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(log)} aria-label="Edit log" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-secondary)' }}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => del(log.id)} aria-label="Delete log" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Did</p>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{log.did}</p>
                      </div>
                      {log.doing && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Next</p>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{log.doing}</p>
                        </div>
                      )}
                      {log.blockers && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-red-400">Blockers</p>
                          <p className="text-[15px] leading-relaxed text-red-400 whitespace-pre-wrap">{log.blockers}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* RIGHT PANEL — team feed */}
        <section className="lg:col-span-3 rounded-2xl border overflow-hidden self-start" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Team feed</h2>
            <span className="ml-auto text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{logs.length} submitted</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-24 rounded-xl skeleton" />)}</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>No logs yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{isToday ? 'Be the first to log today.' : 'Nobody logged on this day.'}</p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <AnimatePresence initial={false}>
                {logs.map((l, i) => (
                  <motion.li key={l.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, ease: ease.expo }} className="p-4 sm:p-5 flex gap-3">
                    <Initials name={l.user?.full_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>{l.user_id === user.id ? 'You' : l.user?.full_name}</p>
                        {l.user?.job_title && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.user.job_title}</span>}
                        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(l.updated_at), 'h:mm a')}</span>
                      </div>
                      <p className="text-[15px] leading-relaxed mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>{l.did}</p>
                      {l.blockers && (
                        <p className="mt-2 text-sm rounded-lg p-2.5 flex gap-2 break-words" style={{ background: 'rgba(239,68,68,.1)', color: '#F87171' }}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{l.blockers}
                        </p>
                      )}
                      {(l.leads_added > 0 || l.leads_converted > 0) && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {l.leads_added > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,.14)', color: '#34D399' }}>+{l.leads_added} leads</span>}
                          {l.leads_converted > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(96,165,250,.14)', color: '#60A5FA' }}>{l.leads_converted} converted</span>}
                        </div>
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}