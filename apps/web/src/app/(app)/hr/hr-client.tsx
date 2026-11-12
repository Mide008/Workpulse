// apps/web/src/app/(app)/hr/hr-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Calendar, ClipboardList, Check, X, Plus, Loader2, Star, Clock, 
  DollarSign, ShoppingBag, FileText, KeyRound, AlertTriangle 
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import TiltCard from '@/components/motion/tilt-card'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  approved: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-red-500 bg-red-500/10 border-red-500/20',
}

const TYPE_ICONS: Record<string, any> = {
  leave: Calendar,
  expense: DollarSign,
  purchase: ShoppingBag,
  document: FileText,
  access: KeyRound,
  other: AlertTriangle,
}

export default function HRClient({ approvals: initialApprovals, appraisals: initialAppraisals, members, user }: {
  approvals: any[]; appraisals: any[]; members: any[]; user: any
}) {
  const [tab, setTab] = useState<'requests' | 'appraisals'>('requests')
  const [requestTab, setRequestTab] = useState<'team' | 'mine'>('team')
  const [approvals, setApprovals] = useState(initialApprovals)
  const [appraisals, setAppraisals] = useState(initialAppraisals)
  const [showAppraisalForm, setShowAppraisalForm] = useState(false)
  const [creatingAppraisal, setCreatingAppraisal] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  
  // Review state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const [appraisalForm, setAppraisalForm] = useState({ userId: '', period: 'Q4 2026', selfAssessment: '' })

  async function reviewRequest(id: string, status: 'approved' | 'rejected', note?: string) {
    setReviewingId(id)
    const res = await fetch(`/api/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    })
    if (res.ok) {
      const { approval } = await res.json()
      setApprovals(prev => prev.map(a => a.id === id ? approval : a))
      toast.success(`Request ${status}`)
      setRejectingId(null)
      setReviewNote('')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to update request')
    }
    setReviewingId(null)
  }

  async function generateAppraisal(e: React.FormEvent) {
    e.preventDefault()
    if (!appraisalForm.userId) { toast.error('Select a team member'); return }
    setCreatingAppraisal(true)
    const res = await fetch('/api/hr/appraisals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appraisalForm),
    })
    if (res.ok) {
      const { appraisal } = await res.json()
      setAppraisals(prev => [appraisal, ...prev])
      setShowAppraisalForm(false)
      setAppraisalForm({ userId: '', period: 'Q4 2026', selfAssessment: '' })
      toast.success('Appraisal generated successfully')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to generate appraisal')
    }
    setCreatingAppraisal(false)
  }

  const inputClass = 'w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  const isManager = user.roleLevel <= 2
  const filteredRequests = requestTab === 'mine' ? approvals.filter(a => a.requester_id === user.id) : approvals
  const pendingRequests = filteredRequests.filter(a => a.status === 'pending')

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-6 pb-20">
      <motion.div variants={staggerItem} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">HR & Approvals</h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">Manage team requests and performance appraisals</p>
        </div>
        <button onClick={() => setShowAppraisalForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform" style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" /> New Appraisal
        </button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4">
        {[ { label: 'Pending Requests', value: pendingRequests.length, color: '#F59E0B', icon: Clock }, { label: 'Team members', value: members.length, color: '#6366F1', icon: Users }, { label: 'Appraisals', value: appraisals.length, color: '#10B981', icon: ClipboardList } ].map(s => (
          <TiltCard key={s.label} intensity={8}>
            <div className="rounded-3xl border p-5 bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border)' }}>
              <div className="p-2.5 rounded-xl w-fit mb-3" style={{ background: `${s.color}15` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-1 text-[var(--text-muted)]">{s.label}</p>
            </div>
          </TiltCard>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([['requests', 'Team Requests'], ['appraisals', 'Appraisals']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)} className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all" style={{ color: tab === t ? 'var(--primary)' : 'var(--text-secondary)', borderBottomColor: tab === t ? 'var(--primary)' : 'transparent' }}>{label}</button>
        ))}
      </motion.div>

      {tab === 'requests' && (
        <motion.div variants={staggerItem} className="space-y-5">
          {isManager && (
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)' }}>
              {[['team','Team Inbox'],['mine','My Requests']].map(([v,l]) => (
                <button key={v} onClick={() => setRequestTab(v as any)} className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all" style={requestTab===v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text-secondary)' }}>{l}</button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filteredRequests.length === 0 ? <div className="text-center py-16 text-[var(--text-muted)] border rounded-3xl border-dashed" style={{ borderColor: 'var(--border)' }}>No requests found.</div> : filteredRequests.map(req => {
              const TypeIcon = TYPE_ICONS[req.type] || AlertTriangle;
              return (
                <div key={req.id} className="flex flex-col p-5 rounded-3xl border transition-all hover:border-[var(--primary)] gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-4 w-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: 'var(--bg-elevated)' }}>
                      <TypeIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <Avatar size="md">{req.requester?.avatar_url ? <AvatarImage src={req.requester.avatar_url} /> : <AvatarFallback>{getInitials(req.requester?.full_name ?? '')}</AvatarFallback>}</Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{req.title}</p>
                        <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border', STATUS_STYLE[req.status])}>{req.status}</span>
                      </div>
                      <p className="text-sm mt-1 text-[var(--text-secondary)]">
                        {req.requester?.full_name} · {req.type.toUpperCase()} · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                      {req.amount && <p className="text-sm font-bold mt-1 text-[var(--text-primary)]">Amount: {req.currency} {req.amount}</p>}
                      {(req.start_date || req.end_date) && <p className="text-xs mt-1 text-[var(--text-muted)]">{req.start_date} → {req.end_date}</p>}
                      
                      {req.status !== 'pending' && req.reviewer?.full_name && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 italic">
                          {req.status === 'approved' ? '✅ Approved' : '❌ Rejected'} by {req.reviewer.full_name} 
                          {req.review_note ? ` · "${req.review_note}"` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Approval Actions */}
                  {req.status === 'pending' && isManager && requestTab === 'team' && (
                    <div className="w-full mt-2 pt-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
                      {rejectingId === req.id && (
                        <input 
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="Reason for rejection (optional)..."
                          className="w-full h-10 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          style={inputStyle}
                        />
                      )}
                      <div className="flex gap-2 w-full sm:w-auto self-end">
                        <button onClick={() => reviewRequest(req.id, 'approved')} disabled={reviewingId === req.id} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                          {reviewingId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Check className="w-4 h-4 inline mr-1"/>Approve</>}
                        </button>
                        <button onClick={() => {
                          if (rejectingId === req.id) reviewRequest(req.id, 'rejected', reviewNote)
                          else setRejectingId(req.id)
                        }} disabled={reviewingId === req.id} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          {reviewingId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <><X className="w-4 h-4 inline mr-1"/>{rejectingId === req.id ? 'Confirm Reject' : 'Reject'}</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {tab === 'appraisals' && (
        <motion.div variants={staggerItem} className="space-y-3">
          {appraisals.length === 0 ? <div className="text-center py-16 text-[var(--text-muted)] border rounded-3xl border-dashed" style={{ borderColor: 'var(--border)' }}>No appraisals yet.</div> : appraisals.map(appraisal => {
            const grade = appraisal.kpi_score >= 90 ? 'A' : appraisal.kpi_score >= 80 ? 'B' : appraisal.kpi_score >= 65 ? 'C' : 'D'
            const gradeColor = appraisal.kpi_score >= 90 ? '#10B981' : appraisal.kpi_score >= 80 ? '#3B82F6' : appraisal.kpi_score >= 65 ? '#F59E0B' : '#EF4444'
            return (
              <div key={appraisal.id} className="p-6 rounded-3xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-5">
                  <Avatar size="lg">{appraisal.user?.avatar_url ? <AvatarImage src={appraisal.user.avatar_url} /> : <AvatarFallback>{getInitials(appraisal.user?.full_name ?? '')}</AvatarFallback>}</Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-base font-bold text-[var(--text-primary)]">{appraisal.user?.full_name}</p>
                      <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: gradeColor, background: `${gradeColor}15`, borderColor: `${gradeColor}30` }}>Grade {grade} — {appraisal.kpi_score}%</span>
                    </div>
                    <p className="text-sm mt-1 text-[var(--text-muted)]">Period: {appraisal.period} · {appraisal.tasks_completed} tasks · {appraisal.goals_achieved} goals</p>
                    {appraisal.ai_narrative && <p className="text-sm mt-3 text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-elevated)] p-4 rounded-xl">{appraisal.ai_narrative}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showAppraisalForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAppraisalForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md rounded-3xl border p-6 shadow-2xl" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-xl font-bold mb-5">Generate appraisal</h3>
              <form onSubmit={generateAppraisal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Team member *</label>
                  <select value={appraisalForm.userId} onChange={e => setAppraisalForm(p => ({ ...p, userId: e.target.value }))} className={inputClass} style={inputStyle} required>
                    <option value="">Select member</option>
                    {members && members.length > 0 ? members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>) : <option value="" disabled>No members found</option>}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-2">Period</label><input value={appraisalForm.period} onChange={e => setAppraisalForm(p => ({ ...p, period: e.target.value }))} className={inputClass} style={inputStyle} /></div>
                <div><label className="block text-sm font-medium mb-2">Manager notes</label><textarea value={appraisalForm.selfAssessment} onChange={e => setAppraisalForm(p => ({ ...p, selfAssessment: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={inputStyle} /></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAppraisalForm(false)} className="flex-1 h-11 rounded-xl border font-bold" style={{ borderColor: 'var(--border)' }}>Cancel</button><button type="submit" disabled={creatingAppraisal} className="flex-1 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>{creatingAppraisal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Generate'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}