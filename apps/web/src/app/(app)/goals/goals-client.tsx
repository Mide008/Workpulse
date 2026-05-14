'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, ChevronDown, Check, X, Loader2 } from 'lucide-react'
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

const schema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  metricLabel: z.string().optional(),
  targetValue: z.string().default('100'),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  startDate: z.string(),
  dueDate: z.string(),
})

const statusBadge: Record<string, BadgeVariant> = {
  active: 'info', completed: 'success', paused: 'warning', cancelled: 'danger',
}

// Helper to safely format a date, returning '—' if invalid
function safeFormatDate(date: string | null) {
  if (!date) return '—'
  try {
    return formatDate(date)
  } catch {
    return '—'
  }
}

export default function GoalsClient({ initialGoals, members, currentUser }: {
  initialGoals: any[]
  members: any[]
  currentUser: any
}) {
  const [goals, setGoals] = useState(initialGoals)
  const [showModal, setShowModal] = useState(false)
  const isManager = currentUser.roleLevel <= 2

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { period: 'monthly', targetValue: '100', userId: currentUser.id },
  })

  async function onSubmit(data: any) {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        targetValue: parseFloat(data.targetValue),
      }),
    })
    if (!res.ok) { toast.error('Failed to create goal'); return }
    const { goal } = await res.json()
    setGoals(prev => [goal, ...prev])
    toast.success('Goal created')
    reset()
    setShowModal(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Goals</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {goals.filter(g => g.status === 'active').length} active goals
          </p>
        </div>
        {isManager && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}>
            Set Goal
          </Button>
        )}
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06]
            flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No goals set yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {isManager ? 'Set goals for your team to track progress' : 'Your manager will set goals for you here'}
          </p>
          {isManager && (
            <Button variant="secondary" size="sm" className="mt-4"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowModal(true)}>
              Set first goal
            </Button>
          )}
        </div>
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
                className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    {user && (
                      <Avatar size="sm">
                        {user.avatar_url
                          ? <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          : <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        }
                      </Avatar>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{goal.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {user && <span className="text-xs text-slate-500">{user.full_name}</span>}
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500 capitalize">{goal.period}</span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">Due {safeFormatDate(goal.due_date)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusBadge[goal.status] ?? 'default'} className="shrink-0">
                    {goal.status}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-slate-500 mb-4">{goal.description}</p>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">
                      {goal.metric_label ?? 'Progress'}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {goal.current_value} / {goal.target_value}
                      <span className="text-slate-500 ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    color={pct >= 100 ? 'emerald' : pct >= 60 ? 'indigo' : 'amber'}
                    size="md"
                    animated
                  />
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
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Set a goal</h3>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {members.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">For</label>
                    <div className="relative">
                      <select {...register('userId')}
                        className="w-full appearance-none bg-white/[0.04] border border-white/10
                          rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                          focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Goal title</label>
                  <input {...register('title')} placeholder="e.g. Close 10 deals this month"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                      text-sm text-white placeholder:text-slate-600 focus:outline-none
                      focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message as string}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Target value</label>
                    <input {...register('targetValue')} type="number" placeholder="100"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                        text-sm text-white placeholder:text-slate-600 focus:outline-none
                        focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Metric label</label>
                    <input {...register('metricLabel')} placeholder="e.g. deals, tasks, %"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                        text-sm text-white placeholder:text-slate-600 focus:outline-none
                        focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Period</label>
                    <div className="relative">
                      <select {...register('period')}
                        className="w-full appearance-none bg-white/[0.04] border border-white/10
                          rounded-xl px-3 py-2.5 pr-7 text-sm text-white focus:outline-none
                          focus:ring-2 focus:ring-indigo-500/50 cursor-pointer">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Start</label>
                    <input {...register('startDate')} type="date"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5
                        text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                        [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Due</label>
                    <input {...register('dueDate')} type="date"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5
                        text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                        [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" className="flex-1"
                    loading={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}