// apps/web/src/app/(app)/analytics/analytics-client.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Target,
  Users, Activity, Download, Sparkles,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { exportToPDF } from '@/lib/pdf-export'
import { ToggleButton } from '@/components/ui/toggle-button'

const WEIGHTS: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function calcKPI(tasks: any[]) {
  const total = tasks.length
  if (!total) return { completionRate: 0, onTimeRate: 0, priorityScore: 0, activityScore: 0, overallScore: 0 }
  const done = tasks.filter((t: any) => t.status === 'done').length
  const completionRate = Math.round((done / total) * 100)
  const withDue = tasks.filter((t: any) => t.due_date && t.status === 'done' && t.completed_at)
  const onTime = withDue.filter((t: any) => new Date(t.completed_at) <= new Date(t.due_date)).length
  const onTimeRate = withDue.length > 0 ? Math.round((onTime / withDue.length) * 100) : completionRate
  const doneW = tasks.filter((t: any) => t.status === 'done').reduce((s: number, t: any) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const totalW = tasks.reduce((s: number, t: any) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const priorityScore = totalW > 0 ? Math.round((doneW / totalW) * 100) : 0
  const activityScore = Math.min(100, Math.round(((total / 4.3) / 5) * 100))
  const overallScore = Math.round(completionRate * 0.35 + onTimeRate * 0.30 + priorityScore * 0.20 + activityScore * 0.15)
  return { completionRate, onTimeRate, priorityScore, activityScore, overallScore }
}

function grade(score: number) {
  if (score >= 90) return { label: 'Excellent', grade: 'A', color: '#10B981', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
  if (score >= 80) return { label: 'Good', grade: 'B', color: '#3B82F6', badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (score >= 65) return { label: 'Fair', grade: 'C', color: '#F59E0B', badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  return { label: 'Needs Work', grade: 'D', color: '#EF4444', badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400' }
}

function Heatmap({ tasks }: { tasks: any[] }) {
  const cells = useMemo(() => {
    const grid: Record<string, number> = {}
    const now = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      grid[d.toISOString().split('T')[0]] = 0
    }
    tasks.forEach((t: any) => {
      const day = t.created_at?.split('T')[0]
      if (day && grid[day] !== undefined) grid[day]++
    })
    return Object.entries(grid)
  }, [tasks])

  const max = Math.max(...cells.map(([, v]) => v), 1)
  const intensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-200 dark:bg-slate-800'
    const i = Math.ceil((count / max) * 4)
    return ['', 'bg-indigo-200 dark:bg-indigo-900', 'bg-indigo-400 dark:bg-indigo-700', 'bg-indigo-500 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-500'][i]
  }

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="w-6 text-center text-[9px] text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(([date, count]) => (
          <div key={date} className={cn('w-6 h-6 rounded-sm transition-all', intensityClass(count))}
            title={`${date}: ${count} task${count !== 1 ? 's' : ''}`} />
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-slate-400">Less</span>
        {['bg-slate-200 dark:bg-slate-800', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600'].map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', c)} />
        ))}
        <span className="text-[10px] text-slate-400">More</span>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94A3B8', in_progress: '#3B82F6', review: '#8B5CF6', blocked: '#EF4444', done: '#10B981',
}

export default function AnalyticsClient({ tasks, members, blockedTasks, currentUser }: {
  tasks: any[]; members: any[] | null; blockedTasks: any[]; currentUser: any
}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const kpi = useMemo(() => calcKPI(tasks), [tasks])
  const kpiGrade = grade(kpi.overallScore)

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t: any) => { counts[t.status] = (counts[t.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#94A3B8',
    }))
  }, [tasks])

  const trendData = useMemo(() => {
    const days: Record<string, { date: string; created: number; completed: number }> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), created: 0, completed: 0 }
    }
    tasks.forEach((t: any) => {
      const c = t.created_at?.split('T')[0]
      if (days[c]) days[c].created++
      if (t.status === 'done' && t.completed_at) {
        const d = t.completed_at.split('T')[0]
        if (days[d]) days[d].completed++
      }
    })
    return Object.values(days)
  }, [tasks])

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    tasks.forEach((t: any) => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
    return [
      { name: 'Critical', value: counts.critical, fill: '#EF4444' },
      { name: 'High', value: counts.high, fill: '#F97316' },
      { name: 'Medium', value: counts.medium, fill: '#F59E0B' },
      { name: 'Low', value: counts.low, fill: '#94A3B8' },
    ]
  }, [tasks])

  const blockerDigest = useMemo(() => {
    const cats: Record<string, number> = {}
    blockedTasks.forEach(t => { const cat = t.blocker_category ?? 'Other'; cats[cat] = (cats[cat] ?? 0) + 1 })
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [blockedTasks])

  const memberStats = useMemo(() => {
    if (!members) return []
    return members.map((m: any) => ({
      ...m,
      kpi: calcKPI(tasks.filter((t: any) => t.assigned_to === m.id)),
      taskCount: tasks.filter((t: any) => t.assigned_to === m.id).length,
    })).sort((a: any, b: any) => b.kpi.overallScore - a.kpi.overallScore)
  }, [members, tasks])

  const fetchAI = useCallback(async () => {
    setAiLoading(true)
    setAiSummary('')
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedMember ?? currentUser?.id, period }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setAiSummary(summary)
      } else {
        setAiSummary('Unable to generate summary. Try again.')
      }
    } catch {
      setAiSummary('Network error. Try again.')
    } finally {
      setAiLoading(false)
    }
  }, [selectedMember, currentUser?.id, period])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportToPDF({
        elementId: 'analytics-report',
        filename: `workpulse-${period}-${new Date().toISOString().split('T')[0]}`,
        title: `Performance Report — ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }, [period])

  const tooltipStyle = {
    background: 'var(--bg-elevated,#1e293b)',
    border: '1px solid var(--border,rgba(255,255,255,0.08))',
    borderRadius: 12,
    color: 'var(--text-primary,#f8fafc)',
    fontSize: 12,
  }

  const kpiCards = [
    { label: 'Overall', value: kpi.overallScore, color: '#6366F1', icon: Target },
    { label: 'Completion', value: kpi.completionRate, color: '#10B981', icon: CheckCircle2 },
    { label: 'On-time', value: kpi.onTimeRate, color: '#3B82F6', icon: Clock },
    { label: 'Priority', value: kpi.priorityScore, color: '#8B5CF6', icon: TrendingUp },
    { label: 'Activity', value: kpi.activityScore, color: '#F59E0B', icon: Activity },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Analytics & Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">KPI scoring, performance insights, team overview</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center p-1 gap-1 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-elevated)' }}>
            {(['week', 'month', 'quarter'] as const).map(p => (
              <ToggleButton key={p} active={period === p} onClick={() => setPeriod(p)}>
                {p}
              </ToggleButton>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition disabled:opacity-50">
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div id="analytics-report" className="space-y-6">
        {/* KPI Banner */}
        <div className="rounded-2xl p-6 border border-indigo-500/20" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)' }}>
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <p className="text-[var(--text-secondary)] text-sm mb-2">Overall KPI Score</p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black tabular-nums" style={{ color: kpiGrade.color }}>
                  {kpi.overallScore}
                </span>
                <div>
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', kpiGrade.badgeBg)}>
                    {kpiGrade.label}
                  </span>
                  <p className="text-xl font-bold mt-1" style={{ color: kpiGrade.color }}>Grade {kpiGrade.grade}</p>
                  <p className="text-xs text-[var(--text-muted)]">out of 100</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-48">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${kpi.overallScore}%`, background: kpiGrade.color }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
                <span>0 — Needs Work</span><span>100 — Excellent</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { g: 'A', r: '90+', c: '#10B981', b: 'bg-emerald-500/10 text-emerald-400' },
                { g: 'B', r: '80+', c: '#3B82F6', b: 'bg-blue-500/10 text-blue-400' },
                { g: 'C', r: '65+', c: '#F59E0B', b: 'bg-amber-500/10 text-amber-400' },
                { g: 'D', r: '0+', c: '#EF4444', b: 'bg-red-500/10 text-red-400' },
              ].map(item => (
                <div key={item.g} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold', item.b)}>
                  <span>{item.g}</span>
                  <span className="opacity-70">{item.r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpiCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--text-muted)]">{card.label}</span>
                <div className="p-1.5 rounded-lg bg-[var(--bg-elevated)]">
                  <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: card.color }}>
                {card.value}<span className="text-lg">%</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
            Activity Heatmap — Last 28 Days
          </h3>
          <Heatmap tasks={tasks} />
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-5">Task Activity (14 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={2} dot={false} name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={false} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Chart */}
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-5">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <ReTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Tasks">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-5">Status Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={`status-cell-${i}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-[var(--text-secondary)] capitalize">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blocker Digest */}
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[var(--text-primary)]">Blocker Digest</h3>
              {blockedTasks.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                  {blockedTasks.length} active
                </span>
              )}
            </div>
            {blockedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">No blockers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockerDigest.map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-sm text-slate-300">{cat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-[var(--bg-elevated)] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.round((count / blockedTasks.length) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] w-4">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Performance Insights
            </h3>
            <div className="flex items-center gap-3">
              {members && members.length > 0 && currentUser?.roleLevel <= 2 && (
                <select
                  value={selectedMember ?? ''}
                  onChange={e => setSelectedMember(e.target.value || null)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)]/10 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">My report</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              )}
              <button onClick={fetchAI} disabled={aiLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Analysing...' : 'Generate Insights'}
              </button>
            </div>
          </div>

          {aiSummary ? (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
              <p className="text-xs text-[var(--text-muted)] font-medium mb-3 uppercase tracking-wider">
                Performance Report · {period}
              </p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--text-primary)' }}>
                  {aiSummary}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-[var(--border)][0.06] rounded-xl">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-sm">Click Generate Insights to receive a data-driven performance narrative</p>
              <p className="text-slate-600 text-xs mt-1">Based on your actual task activity, completion rates, and delivery patterns</p>
            </div>
          )}
        </div>

        {/* Team Performance */}
        {members && memberStats.length > 0 && (
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-secondary)]" />
              Team Performance Comparison
            </h3>
            <div className="space-y-4">
              {memberStats.map((member: any, i: number) => {
                const rating = grade(member.kpi.overallScore)
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-48 min-w-0">
                      <span className="text-xs text-slate-600 w-4 shrink-0">#{i + 1}</span>
                      <Avatar className="w-8 h-8 shrink-0">
                        {member.avatar_url ? (
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        ) : (
                          <AvatarFallback className="text-xs bg-[var(--bg-elevated)]">{getInitials(member.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.full_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{member.taskCount} tasks</p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[var(--text-muted)]">KPI Score</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', rating.badgeBg)}>
                            Grade {rating.grade}
                          </span>
                          <span className="text-xs font-bold" style={{ color: rating.color }}>
                            {member.kpi.overallScore}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${member.kpi.overallScore}%`, background: rating.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}