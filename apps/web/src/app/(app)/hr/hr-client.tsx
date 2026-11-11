// apps/web/src/app/(app)/hr/hr-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, ClipboardList, Check, X,
  Plus, Loader2, Star, Clock, FileText,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Maternity/Paternity', 'Study Leave', 'Compassionate', 'Unpaid Leave']
const STATUS_STYLE: Record<string, string> = {
  pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  approved: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-red-500 bg-red-500/10 border-red-500/20',
  completed: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
}

export default function HRClient({ leaveRequests: initial, appraisals: initialAppraisals, members, user }: {
  leaveRequests: any[]; appraisals: any[]; members: any[]; user: any
}) {
  const [tab, setTab] = useState<'leave' | 'appraisals'>('leave')
  const [leaveTab, setLeaveTab] = useState<'team' | 'mine'>('team')
  const [leaveRequests, setLeaveRequests] = useState(initial)
  const [appraisals, setAppraisals] = useState(initialAppraisals)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showAppraisalForm, setShowAppraisalForm] = useState(false)
  const [creatingLeave, setCreatingLeave] = useState(false)
  const [creatingAppraisal, setCreatingAppraisal] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const [leaveForm, setLeaveForm] = useState({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' })
  const [appraisalForm, setAppraisalForm] = useState({ userId: '', period: 'Q3 2025', selfAssessment: '' })

  function calcDays(start: string, end: string): number {
    if (!start || !end) return 0
    return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1)
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault()
    const days = calcDays(leaveForm.startDate, leaveForm.endDate)
    if (days < 1) { toast.error('End date must be after start date'); return }
    setCreatingLeave(true)
    const res = await fetch('/api/hr/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...leaveForm, daysRequested: days }),
    })
    if (res.ok) {
      const { leave } = await res.json()
      setLeaveRequests(prev => [leave, ...prev])
      setShowLeaveForm(false)
      setLeaveForm({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' })
      toast.success('Leave request submitted successfully')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to submit leave request')
    }
    setCreatingLeave(false)
  }

  async function reviewLeave(id: string, status: 'approved' | 'rejected') {
    setReviewingId(id)
    const res = await fetch(`/api/hr/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status, reviewed_at: new Date().toISOString() } : l))
      toast.success(`Leave request ${status}`)
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to update leave request')
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
      setAppraisalForm({ userId: '', period: 'Q3 2025', selfAssessment: '' })
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
  const filteredLeaves = leaveTab === 'mine' ? leaveRequests.filter(l => l.user_id === user.id) : leaveRequests
  const pendingLeave = filteredLeaves.filter(l => l.status === 'pending')

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-6 pb-20">
      <motion.div variants={staggerItem} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">HR Management</h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">Leave management and performance appraisals</p>
        </div>
        <button onClick={() => tab === 'leave' ? setShowLeaveForm(true) : setShowAppraisalForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform" style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />{tab === 'leave' ? 'Request leave' : 'New appraisal'}
        </button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4">
        {[ { label: 'Pending leave', value: pendingLeave.length, color: '#F59E0B', icon: Clock }, { label: 'Team members', value: members.length, color: '#6366F1', icon: Users }, { label: 'Appraisals', value: appraisals.length, color: '#10B981', icon: ClipboardList } ].map(s => (
          <div key={s.label} className="rounded-3xl border p-5 bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border)' }}>
            <div className="p-2.5 rounded-xl w-fit mb-3" style={{ background: `${s.color}15` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-1 text-[var(--text-muted)]">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([['leave', 'Leave Requests'], ['appraisals', 'Appraisals']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)} className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all" style={{ color: tab === t ? 'var(--primary)' : 'var(--text-secondary)', borderBottomColor: tab === t ? 'var(--primary)' : 'transparent' }}>{label}</button>
        ))}
      </motion.div>

      {tab === 'leave' && (
        <motion.div variants={staggerItem} className="space-y-5">
          {isManager && (
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)' }}>
              {[['team','Team Inbox'],['mine','My Requests']].map(([v,l]) => (
                <button key={v} onClick={() => setLeaveTab(v as any)} className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all" style={leaveTab===v ? { background:'var(--primary)', color:'#fff' } : { color:'var(--text-secondary)' }}>{l}</button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filteredLeaves.length === 0 ? <div className="text-center py-16 text-[var(--text-muted)] border rounded-3xl border-dashed" style={{ borderColor: 'var(--border)' }}>No leave requests found.</div> : filteredLeaves.map(leave => (
              <div key={leave.id} className="flex items-center gap-5 p-5 rounded-3xl border transition-all hover:border-[var(--primary)]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <Avatar size="md">{leave.user?.avatar_url ? <AvatarImage src={leave.user.avatar_url} /> : <AvatarFallback>{getInitials(leave.user?.full_name ?? '')}</AvatarFallback>}</Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{leave.user?.full_name}</p>
                    <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border', STATUS_STYLE[leave.status])}>{leave.status}</span>
                  </div>
                  <p className="text-sm mt-1 text-[var(--text-secondary)]">{leave.type} · {leave.days_requested} day{leave.days_requested !== 1 ? 's' : ''} · {new Date(leave.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(leave.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {leave.reason && <p className="text-xs mt-1 text-[var(--text-muted)] truncate">{leave.reason}</p>}
                  {leave.status !== 'pending' && leave.reviewed_at && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 italic flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500"/> Reviewed {formatDistanceToNow(new Date(leave.reviewed_at), { addSuffix: true })}</p>
                  )}
                </div>
                {leave.status === 'pending' && isManager && leaveTab === 'team' && (
                  <div className="flex gap-2">
                    <button onClick={() => reviewLeave(leave.id, 'approved')} disabled={reviewingId === leave.id} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                      {reviewingId === leave.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Check className="w-4 h-4 inline mr-1"/>Approve</>}
                    </button>
                    <button onClick={() => reviewLeave(leave.id, 'rejected')} disabled={reviewingId === leave.id} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {reviewingId === leave.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <><X className="w-4 h-4 inline mr-1"/>Reject</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
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
        {showLeaveForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md rounded-3xl border p-6 shadow-2xl" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-xl font-bold mb-5">Request leave</h3>
              <form onSubmit={submitLeave} className="space-y-4">
                <div><label className="block text-sm font-medium mb-2">Leave type</label><select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))} className={inputClass} style={inputStyle}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-2">Start</label><input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} style={inputStyle} required /></div><div><label className="block text-sm font-medium mb-2">End</label><input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} style={inputStyle} required /></div></div>
                <div><label className="block text-sm font-medium mb-2">Reason (optional)</label><textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-[var(--primary)]" style={inputStyle} /></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowLeaveForm(false)} className="flex-1 h-11 rounded-xl border font-bold" style={{ borderColor: 'var(--border)' }}>Cancel</button><button type="submit" disabled={creatingLeave} className="flex-1 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>{creatingLeave ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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