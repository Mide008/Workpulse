// apps/web/src/app/(app)/standup/standup-client.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronLeft, ChevronRight, Users, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays, subDays } from 'date-fns'
import { staggerContainer, staggerItem, blurReveal, ease } from '@/lib/motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default function StandupClient({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState(new Date())
  const [myLog, setMyLog] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ did:'', doing:'', blockers:'', leads_added:'', leads_converted:'' })
  const today = new Date().toDateString() === date.toDateString()

  const load = useCallback(async () => {
    setLoading(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    try {
      const res = await fetch(`/api/standup?date=${dateStr}`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : []
      const all = Array.isArray(data) ? data : []
      setLogs(all)
      const mine = all.find((l: any) => l.user_id === user.id)
      setMyLog(mine ?? null)
      if (mine) {
        setForm({
          did: mine.did || '',
          doing: mine.doing || '',
          blockers: mine.blockers || '',
          leads_added: String(mine.leads_added ?? ''),
          leads_converted: String(mine.leads_converted ?? ''),
        })
      } else {
        setForm({ did: '', doing: '', blockers: '', leads_added: '', leads_converted: '' })
      }
    } catch {
      setLogs([])
    }
    setLoading(false)
  }, [date, user.id])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.did.trim()) { toast.error('What did you do today is required'); return }
    setSubmitting(true)
    const res = await fetch('/api/standup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did: form.did, doing: form.doing, blockers: form.blockers || null,
        leads_added: parseInt(form.leads_added) || 0,
        leads_converted: parseInt(form.leads_converted) || 0,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to submit')
      setSubmitting(false)
      return
    }
    toast.success('Work log submitted')
    setEditing(false)
    await load()
    setSubmitting(false)
  }

  const isManager = user.roleLevel <= 2
  const inp = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all resize-none
    bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]
    focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_15%,transparent)]`
  const lbl = `block text-sm font-medium mb-1.5 text-[var(--text-secondary)]`

  const teamLeads = logs.reduce((sum, l) => sum + (l.leads_added || 0), 0)
  const teamConverted = logs.reduce((sum, l) => sum + (l.leads_converted || 0), 0)
  const teamBlockers = logs.filter(l => l.blockers?.trim()).length

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Work Log</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {today ? "Today's team activity" : format(date, 'EEEE, MMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => setDate(d => subDays(d,1))}
            className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-all"
            style={{ borderColor:'var(--border)' }}>
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </motion.button>
          <span className="text-sm font-medium text-[var(--text-primary)] px-2">{format(date, 'MMM d')}</span>
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => setDate(d => addDays(d,1))} disabled={today}
            className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-all disabled:opacity-40"
            style={{ borderColor:'var(--border)' }}>
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </motion.button>
        </div>
      </motion.div>

      {isManager && (
        <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Team logged',    value:`${logs.length}`, icon:Users,        color:'#6366F1' },
            { label:'Leads added',    value:`${teamLeads}`,   icon:TrendingUp,   color:'#10B981' },
            { label:'Leads converted',value:`${teamConverted}`,icon:CheckCircle2,color:'#3B82F6' },
            { label:'Blockers',       value:`${teamBlockers}`,icon:AlertTriangle, color:'#EF4444' },
          ].map(s => (
            <motion.div key={s.label} whileHover={{ y:-1 }}
              className="p-4 rounded-2xl border" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:`${s.color}18` }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color:s.color }} />
                </div>
              </div>
              <p className="text-2xl font-black tabular-nums" style={{ color:s.color }}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.08 }}
            className="rounded-2xl border overflow-hidden" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor:'var(--border)' }}>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {today ? 'My log for today' : `My log · ${format(date,'MMM d')}`}
              </h2>
              {myLog && !editing && today && (
                <motion.button whileHover={{ scale:1.05 }} onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:opacity-80 transition">
                  <Edit2 className="w-3 h-3" />Edit
                </motion.button>
              )}
            </div>
            {!today ? (
              <div className="p-5 text-center py-10">
                <p className="text-sm text-[var(--text-muted)]">You can only submit today's log.</p>
              </div>
            ) : myLog && !editing ? (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">What I did</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{myLog.did}</p>
                </div>
                {myLog.doing && <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">What I'm doing next</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{myLog.doing}</p>
                </div>}
                {myLog.blockers && <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1.5">Blockers</p>
                  <p className="text-sm text-red-400 leading-relaxed">{myLog.blockers}</p>
                </div>}
                {(myLog.leads_added > 0 || myLog.leads_converted > 0) && (
                  <div className="flex gap-3 pt-1">
                    {myLog.leads_added > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:'rgba(16,185,129,0.1)', color:'#10B981' }}>{myLog.leads_added} leads added</span>}
                    {myLog.leads_converted > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:'rgba(59,130,246,0.1)', color:'#3B82F6' }}>{myLog.leads_converted} converted</span>}
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)]">Submitted {format(new Date(myLog.updated_at), 'h:mm a')}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                <div>
                  <label className={lbl}>What did you do today? *</label>
                  <textarea value={form.did} onChange={e=>setForm(f=>({...f,did:e.target.value}))}
                    placeholder="Summarise what you completed or worked on…" rows={3} required className={inp} />
                </div>
                <div>
                  <label className={lbl}>What are you doing next?</label>
                  <textarea value={form.doing} onChange={e=>setForm(f=>({...f,doing:e.target.value}))}
                    placeholder="What's your plan for tomorrow?" rows={2} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Any blockers?</label>
                  <textarea value={form.blockers} onChange={e=>setForm(f=>({...f,blockers:e.target.value}))}
                    placeholder="Anything blocking your progress?" rows={2} className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Leads added</label>
                    <input type="number" min="0" value={form.leads_added} onChange={e=>setForm(f=>({...f,leads_added:e.target.value}))}
                      placeholder="0" className={`${inp} h-11`} />
                  </div>
                  <div>
                    <label className={lbl}>Leads converted</label>
                    <input type="number" min="0" value={form.leads_converted} onChange={e=>setForm(f=>({...f,leads_converted:e.target.value}))}
                      placeholder="0" className={`${inp} h-11`} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button type="submit" disabled={submitting} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background:'var(--primary)' }}>
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Submitting…</> : <><Send className="w-4 h-4"/>Submit log</>}
                  </motion.button>
                  {editing && <button type="button" onClick={() => setEditing(false)}
                    className="px-4 h-11 rounded-xl border text-sm font-medium text-[var(--text-secondary)]" style={{ borderColor:'var(--border)' }}>Cancel</button>}
                </div>
              </form>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-3">
          <motion.div initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.1 }}
            className="rounded-2xl border overflow-hidden" style={{ background:'var(--bg-surface)', borderColor:'var(--border)' }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor:'var(--border)' }}>
              <Users className="w-4 h-4" style={{ color:'var(--primary)' }} />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Team feed</h2>
              <span className="ml-auto text-xs font-medium text-[var(--text-muted)]">{logs.length} submitted</span>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl skeleton"/>)}</div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">No logs submitted yet today.</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y" style={{ borderColor:'var(--border)' }}>
                {logs.map(l => (
                  <motion.div key={l.id} variants={staggerItem} className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar size="sm">
                        {l.user?.avatar_url ? <AvatarImage src={l.user.avatar_url} alt={l.user.full_name}/> : <AvatarFallback>{getInitials(l.user?.full_name)}</AvatarFallback>}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{l.user?.full_name}</p>
                          <span className="text-xs text-[var(--text-muted)]">{l.user?.role ?? ''}</span>
                          <span className="text-xs text-[var(--text-muted)] ml-auto">{format(new Date(l.updated_at),'h:mm a')}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{l.did}</p>
                        {l.blockers && (
                          <div className="flex items-start gap-1.5 p-2.5 rounded-lg" style={{ background:'rgba(239,68,68,0.08)' }}>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400">{l.blockers}</p>
                          </div>
                        )}
                        {(l.leads_added > 0 || l.leads_converted > 0) && (
                          <div className="flex gap-2 mt-2">
                            {l.leads_added > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'rgba(16,185,129,0.1)',color:'#10B981' }}>+{l.leads_added} leads</span>}
                            {l.leads_converted > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'rgba(59,130,246,0.1)',color:'#3B82F6' }}>{l.leads_converted} converted</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}