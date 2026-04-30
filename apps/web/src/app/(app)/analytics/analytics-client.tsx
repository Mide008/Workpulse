'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Target, Users, Activity,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { staggerItem } from '@/lib/motion'

const WEIGHTS: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function calcKPI(tasks: any[]) {
  const total = tasks.length
  if (total === 0) return { completionRate: 0, onTimeRate: 0, priorityScore: 0, activityScore: 0, overallScore: 0 }

  const now = new Date()
  const completed = tasks.filter(t => t.status === 'done').length
  const completionRate = Math.round((completed / total) * 100)

  const tasksWithDue = tasks.filter(t => t.due_date && t.status === 'done' && t.completed_at)
  const onTime = tasksWithDue.filter(t => new Date(t.completed_at) <= new Date(t.due_date)).length
  const onTimeRate = tasksWithDue.length > 0 ? Math.round((onTime / tasksWithDue.length) * 100) : completionRate

  const completedW = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const totalW = tasks.reduce((s, t) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const priorityScore = totalW > 0 ? Math.round((completedW / totalW) * 100) : 0

  const tasksPerWeek = total / 4.3
  const activityScore = Math.min(100, Math.round((tasksPerWeek / 5) * 100))

  const overallScore = Math.round(
    completionRate * 0.35 + onTimeRate * 0.30 + priorityScore * 0.20 + activityScore * 0.15
  )

  return { completionRate, onTimeRate, priorityScore, activityScore, overallScore }
}

function kpiColor(score: number) {
  if (score >= 85) return { text: 'text-emerald-400', label: 'Excellent', badge: 'success' as const }
  if (score >= 70) return { text: 'text-blue-400', label: 'Good', badge: 'info' as const }
  if (score >= 50) return { text: 'text-amber-400', label: 'Fair', badge: 'warning' as const }
  return { text: 'text-red-400', label: 'Needs work', badge: 'danger' as const }
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#475569',
  in_progress: '#3B82F6',
  review: '#8B5CF6',
  blocked: '#EF4444',
  done: '#10B981',
}

export default function AnalyticsClient({ tasks, members, blockedTasks, currentUser }: {
  tasks: any[]
  members: any[] | null
  blockedTasks: any[]
  currentUser: any
}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const kpi = useMemo(() => calcKPI(tasks), [tasks])

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: STATUS_COLORS[status] ?? '#475569',
    }))
  }, [tasks])

  // Tasks by day (last 14 days)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; created: number; completed: number }> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: 0,
        completed: 0,
      }
    }
    tasks.forEach(t => {
      const created = t.created_at?.split('T')[0]
      if (days[created]) days[created].created++
      if (t.status === 'done' && t.completed_at) {
        const completed = t.completed_at.split('T')[0]
        if (days[completed]) days[completed].completed++
      }
    })
    return Object.values(days)
  }, [tasks])

  // Priority breakdown
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    tasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tasks])

  // Blocker categories
  const blockerDigest = useMemo(() => {
    const cats: Record<string, number> = {}
    blockedTasks.forEach(t => {
      const cat = t.blocker_category ?? 'Other'
      cats[cat] = (cats[cat] ?? 0) + 1
    })
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [blockedTasks])

  const kpiRating = kpiColor(kpi.overallScore)

  const kpiCards = [
    { label: 'Overall Score', value: kpi.overallScore, icon: Target, suffix: '%',
      color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Completion Rate', value: kpi.completionRate, icon: CheckCircle2, suffix: '%',
      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'On-time Rate', value: kpi.onTimeRate, icon: Clock, suffix: '%',
      color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Priority Score', value: kpi.priorityScore, icon: TrendingUp, suffix: '%',
      color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Activity Score', value: kpi.activityScore, icon: Activity, suffix: '%',
      color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Performance insights and KPI scores</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Score banner */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-transparent
        border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-slate-400 text-sm mb-1">Overall KPI Score</p>
            <div className="flex items-baseline gap-3">
              <span className={cn('text-6xl font-bold tabular-nums', kpiRating.text)}>
                {kpi.overallScore}
              </span>
              <div>
                <Badge variant={kpiRating.badge}>{kpiRating.label}</Badge>
                <p className="text-xs text-slate-500 mt-1">out of 100</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-48">
            <Progress value={kpi.overallScore} size="lg" color="indigo" animated />
            <div className="flex justify-between mt-1.5 text-xs text-slate-600">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger-children">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={staggerItem}
            initial="initial"
            animate="animate"
            style={{ animationDelay: `${i * 60}ms` }}
            className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{card.label}</span>
              <div className={cn('p-1.5 rounded-lg', card.bg)}>
                <card.icon className={cn('w-3.5 h-3.5', card.color)} />
              </div>
            </div>
            <p className={cn('text-3xl font-bold', card.color)}>
              {card.value}<span className="text-lg">{card.suffix}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5">Task Activity (Last 14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartTooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={2}
                dot={false} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2}
                dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5">Status Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-400 capitalize">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false} tickLine={false} width={60} />
              <RechartTooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }}
              />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 6, 6, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blocker digest */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Blocker Digest</h3>
            {blockedTasks.length > 0 && (
              <Badge variant="danger" dot>{blockedTasks.length} active</Badge>
            )}
          </div>
          {blockedTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No blockers — great work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockerDigest.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-sm text-slate-300">{cat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-red-500 transition-all"
                        style={{ width: `${Math.round((count / blockedTasks.length) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-white/[0.06] space-y-2 max-h-40 overflow-y-auto">
                {blockedTasks.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="text-xs text-slate-500 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    <div className="min-w-0">
                      <span className="text-slate-300 font-medium">{t.title}</span>
                      {t.blocker_reason && <p className="truncate mt-0.5">{t.blocker_reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team workload — managers only */}
      {members && members.length > 0 && (
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Team Workload
          </h3>
          <div className="space-y-4">
            {members.map((member: any) => {
              const memberTasks = tasks.filter(t => t.assigned_to === member.id)
              const memberKpi = calcKPI(memberTasks)
              const mRating = kpiColor(memberKpi.overallScore)
              return (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar size="sm">
                    {member.avatar_url
                      ? <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      : <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    }
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">{member.full_name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-slate-500">{memberTasks.length} tasks</span>
                        <Badge variant={mRating.badge} className="text-xs">
                          {memberKpi.overallScore}%
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={memberKpi.completionRate}
                      size="sm"
                      color={memberKpi.overallScore >= 70 ? 'emerald' : memberKpi.overallScore >= 50 ? 'amber' : 'red'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}