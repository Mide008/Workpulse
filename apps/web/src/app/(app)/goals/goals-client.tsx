// apps/web/src/app/(app)/goals/goals-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, ChevronDown, Check, X, Loader2, TrendingUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { scaleIn } from '@/lib/motion'
import { EmptyState } from '@/components/ui/empty-state'

// Schema: targetValue is required (no .default())
const schema = z.object({
  userId: z.string().uuid('Please select a team member'),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  metricLabel: z.string().optional(),
  targetValue: z.string().min(1, 'Target value required'),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  startDate: z.string().min(1, 'Start date required'),
  dueDate: z.string().min(1, 'Due date required'),
})

type FormValues = z.infer<typeof schema>  // Now targetValue is required

const statusBadge: Record<string, BadgeVariant> = {
  active: 'info',
  completed: 'success',
  paused: 'warning',
  cancelled: 'danger',
}

function safeFormatDate(date: string | null) {
  if (!date) return '—'
  try {
    return formatDate(date)
  } catch {
    return '—'
  }
}

export default function GoalsClient({
  initialGoals,
  members,
  currentUser,
}: {
  initialGoals: any[]
  members: any[]
  currentUser: any
}) {
  const [goals, setGoals] = useState(initialGoals)
  const [showModal, setShowModal] = useState(false)
  const isManager = currentUser.roleLevel <= 2

  // Check-in state
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [checkinNote, setCheckinNote] = useState('')
  const [checkinValue, setCheckinValue] = useState<number>(0)
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period: 'monthly',
      targetValue: '100',
      userId: currentUser.id,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          targetValue: parseFloat(data.targetValue),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create goal')
      }

      const { goal } = await res.json()
      setGoals(prev => [goal, ...prev])
      toast.success('Goal created successfully')
      reset()
      setShowModal(false)
    } catch (error) {
      toast.error('Could not save goal. Please check your network and parameters.')
    }
  }

  async function submitCheckin() {
    if (!checkingIn) return
    setSubmittingCheckin(true)
    try {
      const res = await fetch(`/api/goals/${checkingIn}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressValue: checkinValue, note: checkinNote }),
      })
      if (res.ok) {
        setGoals(prev => prev.map((g: any) =>
          g.id === checkingIn ? { ...g, current_value: checkinValue } : g
        ))
        toast.success('Check-in recorded')
        setCheckingIn(null)
        setCheckinNote('')
        setCheckinValue(0)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Check-in failed')
      }
    } catch {
      toast.error('Check-in failed')
    } finally {
      setSubmittingCheckin(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Goals</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {goals.filter(g => g.status === 'active').length} active goals
          </p>
        </div>
        {isManager && (
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Set Goal
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-7 h-7" />}
          title="No goals set"
          description="Goals connect daily work to outcomes. Set measurable targets for individuals or the team, then track progress through check-ins over time."
          action={{ label: 'Set first goal', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => {
            const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
            const user = goal.user
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    {user && (
                      <Avatar className="w-8 h-8 shrink-0">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                        ) : (
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{goal.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {user && <span className="text-xs text-[var(--text-muted)]">{user.full_name}</span>}
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-[var(--text-muted)] capitalize">{goal.period}</span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-[var(--text-muted)]">Due {safeFormatDate(goal.due_date)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusBadge[goal.status] ?? 'default'} className="shrink-0">
                    {goal.status}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-[var(--text-muted)] mb-4">{goal.description}</p>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {goal.metric_label ?? 'Progress'}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {goal.current_value} / {goal.target_value}
                      <span className="text-[var(--text-muted)] ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <Progress value={pct} color={pct >= 100 ? 'emerald' : pct >= 60 ? 'indigo' : 'amber'} size="md" />
                </div>

                {/* Check-in button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setCheckingIn(goal.id)
                      setCheckinValue(goal.current_value ?? 0)
                      setCheckinNote('')
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                    style={{ background: 'var(--primary)' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Check-in
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create goal modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              {...scaleIn}
              className="bg-[var(--bg-surface)] border border-[var(--border)]10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-[var(--text-primary)] font-semibold text-lg">Set a goal</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {members.length > 0 && (
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">For</label>
                    <div className="relative">
                      <select
                        {...register('userId')}
                        className="w-full appearance-none bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all cursor-pointer"
                      >
                        {members.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                    {errors.userId && <p className="text-red-400 text-xs mt-1">{errors.userId.message}</p>}
                  </div>
                )}

                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Goal title</label>
                  <input
                    {...register('title')}
                    placeholder="e.g. Close 10 deals this month"
                    className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all"
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Target value</label>
                    <input
                      {...register('targetValue')}
                      type="number"
                      placeholder="100"
                      className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all"
                    />
                    {errors.targetValue && <p className="text-red-400 text-xs mt-1">{errors.targetValue.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Metric label</label>
                    <input
                      {...register('metricLabel')}
                      placeholder="e.g. deals, tasks, %"
                      className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Period</label>
                    <div className="relative">
                      <select
                        {...register('period')}
                        className="w-full appearance-none bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-3 py-2.5 pr-7 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                      >
                        <option value="monthly" className="bg-slate-900 text-white">Monthly</option>
                        <option value="quarterly" className="bg-slate-900 text-white">Quarterly</option>
                        <option value="annual" className="bg-slate-900 text-white">Annual</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Start</label>
                    <input
                      {...register('startDate')}
                      type="date"
                      className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                    />
                    {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Due</label>
                    <input
                      {...register('dueDate')}
                      type="date"
                      className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                    />
                    {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate.message}</p>}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal check-in modal */}
      <AnimatePresence>
        {checkingIn && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setCheckingIn(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-md rounded-2xl border shadow-2xl p-6 pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Record check-in</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  Update progress on this goal. Check-ins build the accountability trail managers and staff can both see.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Current progress
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={checkinValue}
                        onChange={e => setCheckinValue(Number(e.target.value))}
                        className="flex-1 accent-indigo-600"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span className="w-12 text-sm font-bold text-right" style={{ color: 'var(--text-primary)' }}>
                        {checkinValue}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                    </label>
                    <textarea
                      value={checkinNote}
                      onChange={e => setCheckinNote(e.target.value)}
                      rows={3}
                      placeholder="What progress was made? Any blockers?"
                      className="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setCheckingIn(null)}
                    className="flex-1 h-11 rounded-xl border text-sm font-medium transition"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCheckin}
                    disabled={submittingCheckin}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--primary)' }}
                  >
                    {submittingCheckin ? 'Saving...' : 'Save check-in'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}