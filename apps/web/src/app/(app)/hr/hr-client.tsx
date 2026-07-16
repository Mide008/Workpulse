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
  pending: 'text-amber-500 bg-amber-500/10',
  approved: 'text-emerald-500 bg-emerald-500/10',
  rejected: 'text-red-500 bg-red-500/10',
  draft: 'text-slate-400 bg-slate-400/10',
  completed: 'text-blue-500 bg-blue-500/10',
}

export default function HRClient({ leaveRequests: initial, appraisals: initialAppraisals, members, user }: {
  leaveRequests: any[]; appraisals: any[]; members: any[]; user: any
}) {
  const [tab, setTab] = useState<'leave' | 'appraisals'>('leave')
  const [leaveRequests, setLeaveRequests] = useState(initial)
  const [appraisals, setAppraisals] = useState(initialAppraisals)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showAppraisalForm, setShowAppraisalForm] = useState(false)
  const [creatingLeave, setCreatingLeave] = useState(false)
  const [creatingAppraisal, setCreatingAppraisal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' })
  const [appraisalForm, setAppraisalForm] = useState({ userId: '', period: 'Q3 2025', selfAssessment: '' })

  function calcDays(start: string, end: string): number {
    if (!start || !end) return 0
    const s = new Date(start), e = new Date(end)
    return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1)
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
      toast.success('Leave request submitted')
    } else {
      toast.error('Failed to submit leave request')
    }
    setCreatingLeave(false)
  }

  async function reviewLeave(id: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/hr/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      toast.success(`Leave request ${status}`)
    }
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
      toast.success('Appraisal generated with AI narrative')
    } else {
      toast.error('Failed to generate appraisal')
    }
    setCreatingAppraisal(false)
  }

  const inputClass = 'w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  const pendingLeave = leaveRequests.filter(l => l.status === 'pending')

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={staggerItem} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>HR Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Leave management and performance appraisals
          </p>
        </div>
        <button
          onClick={() => tab === 'leave' ? setShowLeaveForm(true) : setShowAppraisalForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />
          {tab === 'leave' ? 'Request leave' : 'New appraisal'}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending leave', value: pendingLeave.length, color: '#F59E0B', icon: Clock },
          { label: 'Team members', value: members.length, color: 'var(--primary)', icon: Users },
          { label: 'Appraisals', value: appraisals.length, color: '#10B981', icon: ClipboardList },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="p-2 rounded-xl w-fit mb-3" style={{ background: `${s.color}18` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([['leave', 'Leave Requests', leaveRequests.length], ['appraisals', 'Appraisals', appraisals.length]] as const).map(([t, label, count]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all"
            style={{
              color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottomColor: tab === t ? 'var(--primary)' : 'transparent',
            }}>
            {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Leave Requests */}
      {tab === 'leave' && (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {leaveRequests.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-7 h-7" />}
              title="No leave requests"
              description="Team members can submit leave requests here. Managers review and approve or reject them."
              action={{ label: 'Submit leave request', onClick: () => setShowLeaveForm(true) }}
            />
          ) : (
            leaveRequests.map(leave => (
              <motion.div key={leave.id} variants={staggerItem}>
                <div className="flex items-center gap-4 p-4 rounded-2xl border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <Avatar size="sm">
                    {leave.user?.avatar_url
                      ? <AvatarImage src={leave.user.avatar_url} alt={leave.user.full_name} />
                      : <AvatarFallback>{getInitials(leave.user?.full_name ?? '')}</AvatarFallback>
                    }
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{leave.user?.full_name}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_STYLE[leave.status])}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {leave.type} · {leave.days_requested} day{leave.days_requested !== 1 ? 's' : ''} ·
                      {new Date(leave.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –
                      {new Date(leave.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {leave.reason && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{leave.reason}</p>}
                  </div>
                  {leave.status === 'pending' && user.roleLevel <= 2 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => reviewLeave(leave.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition">
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button onClick={() => reviewLeave(leave.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Appraisals */}
      {tab === 'appraisals' && (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {appraisals.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-7 h-7" />}
              title="No appraisals yet"
              description="Generate AI-assisted performance appraisals for team members. Appraisals pull data from tasks, goals, and KPI scores automatically."
              action={{ label: 'Generate appraisal', onClick: () => setShowAppraisalForm(true) }}
            />
          ) : (
            appraisals.map(appraisal => {
              const grade = appraisal.kpi_score >= 90 ? 'A' : appraisal.kpi_score >= 80 ? 'B' : appraisal.kpi_score >= 65 ? 'C' : 'D'
              const gradeColor = appraisal.kpi_score >= 90 ? '#10B981' : appraisal.kpi_score >= 80 ? '#3B82F6' : appraisal.kpi_score >= 65 ? '#F59E0B' : '#EF4444'
              return (
                <motion.div key={appraisal.id} variants={staggerItem}>
                  <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-start gap-4">
                      <Avatar size="md">
                        {appraisal.user?.avatar_url
                          ? <AvatarImage src={appraisal.user.avatar_url} alt={appraisal.user.full_name} />
                          : <AvatarFallback>{getInitials(appraisal.user?.full_name ?? '')}</AvatarFallback>
                        }
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{appraisal.user?.full_name}</p>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: gradeColor, background: `${gradeColor}18` }}>
                            Grade {grade} — {appraisal.kpi_score}%
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_STYLE[appraisal.status])}>
                            {appraisal.status}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Period: {appraisal.period} · {appraisal.tasks_completed} tasks · {appraisal.goals_achieved} goals
                        </p>
                        {appraisal.ai_narrative && (
                          <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {appraisal.ai_narrative}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}

      {/* Leave form modal */}
      <AnimatePresence>
        {showLeaveForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLeaveForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Request leave</h3>
                  <button onClick={() => setShowLeaveForm(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={submitLeave} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Leave type</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))}
                      className={inputClass} style={inputStyle}>
                      {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start date</label>
                      <input type="date" value={leaveForm.startDate}
                        onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                        className={inputClass} style={inputStyle} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>End date</label>
                      <input type="date" value={leaveForm.endDate}
                        onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                        className={inputClass} style={inputStyle} required />
                    </div>
                  </div>
                  {leaveForm.startDate && leaveForm.endDate && (
                    <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                      {calcDays(leaveForm.startDate, leaveForm.endDate)} day{calcDays(leaveForm.startDate, leaveForm.endDate) !== 1 ? 's' : ''} requested
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason (optional)</label>
                    <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                      rows={2} placeholder="Brief reason for the leave..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={inputStyle} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowLeaveForm(false)}
                      className="flex-1 h-10 rounded-xl border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingLeave}
                      className="flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}>
                      {creatingLeave && <Loader2 className="w-4 h-4 animate-spin" />}
                      Submit request
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Appraisal form modal */}
      <AnimatePresence>
        {showAppraisalForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAppraisalForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Generate appraisal</h3>
                  <button onClick={() => setShowAppraisalForm(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={generateAppraisal} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Team member *</label>
                    <select value={appraisalForm.userId}
                      onChange={e => setAppraisalForm(p => ({ ...p, userId: e.target.value }))}
                      className={inputClass} style={inputStyle} required>
                      <option value="">Select member</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Period</label>
                    <input value={appraisalForm.period}
                      onChange={e => setAppraisalForm(p => ({ ...p, period: e.target.value }))}
                      placeholder="e.g. Q3 2025, H1 2025"
                      className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Manager notes (optional)</label>
                    <textarea value={appraisalForm.selfAssessment}
                      onChange={e => setAppraisalForm(p => ({ ...p, selfAssessment: e.target.value }))}
                      rows={3} placeholder="Additional context for the AI to include in the narrative..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={inputStyle} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAppraisalForm(false)}
                      className="flex-1 h-10 rounded-xl border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingAppraisal}
                      className="flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}>
                      {creatingAppraisal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                      {creatingAppraisal ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}