'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Target,
  Users, Activity, Download, Loader2, Sparkles, Star,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { exportToPDF } from '@/lib/pdf-export'

const WEIGHTS: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function calcKPI(tasks: any[]) {
  const total = tasks.length
  if (!total) return { completionRate: 0, onTimeRate: 0, priorityScore: 0, activityScore: 0, overallScore: 0 }
  const done = tasks.filter(t => t.status === 'done').length
  const completionRate = Math.round((done / total) * 100)
  const withDue = tasks.filter(t => t.due_date && t.status === 'done' && t.completed_at)
  const onTime = withDue.filter(t => new Date(t.completed_at) <= new Date(t.due_date)).length
  const onTimeRate = withDue.length > 0 ? Math.round((onTime / withDue.length) * 100) : completionRate
  const completedW = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const totalW = tasks.reduce((s, t) => s + (WEIGHTS[t.priority] ?? 1), 0)
  const priorityScore = totalW > 0 ? Math.round((completedW / totalW) * 100) : 0
  const tasksPerWeek = total / 4.3
  const activityScore = Math.min(100, Math.round((tasksPerWeek / 5) * 100))
  const overallScore = Math.round(completionRate * 0.35 + onTimeRate * 0.30 + priorityScore * 0.20 + activityScore * 0.15)
  return { completionRate, onTimeRate, priorityScore, activityScore, overallScore }
}

function kpiColor(score: number): { text: string; label: string; badge: BadgeVariant; grade: string } {
  if (score >= 90) return { text: 'text-emerald-400', label: 'Excellent', badge: 'success', grade: 'A' }
  if (score >= 80) return { text: 'text-blue-400', label: 'Good', badge: 'info', grade: 'B' }
  if (score >= 65) return { text: 'text-amber-400', label: 'Fair', badge: 'warning', grade: 'C' }
  return { text: 'text-red-400', label: 'Needs Work', badge: 'danger', grade: 'D' }
}

function WorkloadHeatmap({ tasks }: { tasks: any[] }) {
  const cells = useMemo(() => {
    const grid: Record<string, number> = {}
    const now = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      grid[d.toISOString().split('T')[0]] = 0
    }
    tasks.forEach(t => {
      const day = t.created_at?.split('T')[0]
      if (day && grid[day] !== undefined) grid[day]++
    })
    return Object.entries(grid)
  }, [tasks])

  const max = Math.max(...cells.map(([, v]) => v), 1)
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="w-6 text-center text-[9px] text-slate-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(([date, count]) => {
          const intensity = count === 0 ? 0 : Math.ceil((count / max) * 4)
          const colors = ['bg-slate-800', 'bg-indigo-900/60', 'bg-indigo-700/60', 'bg-indigo-600/80', 'bg-indigo-500']
          return (
            <div
              key={date}
              className={cn('w-6 h-6 rounded-sm transition-all', colors[intensity])}
              title={`${date}: ${count} task${count !== 1 ? 's' : ''}`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-slate-600">Less</span>
        {['bg-slate-800', 'bg-indigo-900/60', 'bg-indigo-700/60', 'bg-indigo-600/80', 'bg-indigo-500'].map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', c)} />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#475569', in_progress: '#3B82F6',
  review: '#8B5CF6', blocked: '#EF4444', done: '#10B981',
}

export default function AnalyticsClient({ tasks, members, blockedTasks, currentUser }: {
  tasks: any[]; members: any[] | null; blockedTasks: any[]; currentUser: any
}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [aiSummary, setAiSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const kpi = useMemo(() => calcKPI(tasks), [tasks])
  const kpiRating = kpiColor(kpi.overallScore)

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '), value: count, color: STATUS_COLORS[status] ?? '#475569',
    }))
  }, [tasks])

  const trendData = useMemo(() => {
    const days: Record<string, { date: string; created: number; completed: number }> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), created: 0, completed: 0 }
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

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    tasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
    return [
      { name: 'Critical', value: counts.critical, fill: '#EF4444' },
      { name: 'High', value: counts.high, fill: '#F97316' },
      { name: 'Medium', value: counts.medium, fill: '#F59E0B' },
      { name: 'Low', value: counts.low, fill: '#64748B' },
    ]
  }, [tasks])

  const blockerDigest = useMemo(() => {
    const cats: Record<string, number> = {}
    blockedTasks.forEach(t => { const cat = t.blocker_category ?? 'Other'; cats[cat] = (cats[cat] ?? 0) + 1 })
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [blockedTasks])

  const memberStats = useMemo(() => {
    if (!members) return []
    return members.map(member => ({
      ...member,
      kpi: calcKPI(tasks.filter(t => t.assigned_to === member.id)),
      taskCount: tasks.filter(t => t.assigned_to === member.id).length,
    })).sort((a, b) => b.kpi.overallScore - a.kpi.overallScore)
  }, [members, tasks])

  const fetchAISummary = useCallback(async () => {
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
      }
    } catch {
      setAiSummary('Unable to generate AI summary at this time.')
    } finally {
      setAiLoading(false)
    }
  }, [selectedMember, currentUser?.id, period])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportToPDF({
        elementId: 'analytics-report',
        filename: `workpulse-report-${period}-${new Date().toISOString().split('T')[0]}`,
        title: `Performance Report — ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      })
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [period])

  const kpiCards = [
    { label: 'Overall Score', value: kpi.overallScore, icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Completion', value: kpi.completionRate, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'On-time', value: kpi.onTimeRate, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Priority', value: kpi.priorityScore, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Activity', value: kpi.activityScore, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">KPI scoring, performance insights, AI summaries</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                  period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}>
                {p}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" loading={exporting}
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report content wrapper for PDF */}
      <div id="analytics-report" className="space-y-6">
        {/* KPI Score Banner */}
        <div className="bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-transparent
          border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <p className="text-slate-400 text-sm mb-1">Overall KPI Score</p>
              <div className="flex items-baseline gap-3">
                <span className={cn('text-6xl font-bold tabular-nums', kpiRating.text)}>
                  {kpi.overallScore}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={kpiRating.badge}>{kpiRating.label}</Badge>
                    <span className={cn('text-2xl font-bold', kpiRating.text)}>Grade {kpiRating.grade}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">out of 100</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-48">
              <Progress value={kpi.overallScore} size="lg" color="indigo" animated />
              <div className="flex justify-between mt-1.5 text-xs text-slate-600">
                <span>0 — Needs Work</span>
                <span>100 — Excellent</span>
              </div>
            </div>
            {/* Grade legend */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { grade: 'A', range: '90–100', color: 'text-emerald-400 bg-emerald-500/10' },
                { grade: 'B', range: '80–89', color: 'text-blue-400 bg-blue-500/10' },
                { grade: 'C', range: '65–79', color: 'text-amber-400 bg-amber-500/10' },
                { grade: 'D', range: '0–64', color: 'text-red-400 bg-red-500/10' },
              ].map(g => (
                <div key={g.grade} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs', g.color)}>
                  <span className="font-bold">{g.grade}</span>
                  <span className="opacity-70">{g.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpiCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{card.label}</span>
                <div className={cn('p-1.5 rounded-lg', card.bg)}>
                  <card.icon className={cn('w-3.5 h-3.5', card.color)} />
                </div>
              </div>
              <p className={cn('text-3xl font-bold', card.color)}>
                {card.value}<span className="text-lg">%</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Workload Heatmap */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Activity Heatmap — Last 28 Days
          </h3>
          <WorkloadHeatmap tasks={tasks} />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trend */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-5">Task Activity (14 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <RechartTooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={2} dot={false} name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={false} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Priority breakdown */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-5">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <RechartTooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Tasks">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
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
                    {statusData.map((entry, i) => <Cell key={`status-cell-${i}`} fill={entry.color} />)}
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

          {/* Blocker digest */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Blocker Digest</h3>
              {blockedTasks.length > 0 && <Badge variant="danger" dot>{blockedTasks.length} active</Badge>}
            </div>
            {blockedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No blockers</p>
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
                      <div className="w-24 bg-slate-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.round((count / blockedTasks.length) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-4">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights (formerly AI Performance Summary) */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Performance Insights
            </h3>
            <div className="flex items-center gap-3">
              {members && members.length > 0 && currentUser?.roleLevel <= 2 && (
                <select
                  value={selectedMember ?? ''}
                  onChange={e => setSelectedMember(e.target.value || null)}
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm
                    text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">My report</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              )}
              <Button variant="primary" size="sm" loading={aiLoading}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={fetchAISummary}>
                {aiLoading ? 'Analysing...' : 'Generate Insights'}
              </Button>
            </div>
          </div>

          {aiSummary ? (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">
                Performance Report · {period.charAt(0).toUpperCase() + period.slice(1)}
              </p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-slate-300 leading-relaxed text-sm">{aiSummary}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Click Generate Insights to receive a data-driven performance narrative</p>
              <p className="text-slate-600 text-xs mt-1">Based on your actual task activity, completion rates, and delivery patterns</p>
            </div>
          )}
        </div>

        {/* Team Performance — managers only */}
        {members && memberStats.length > 0 && (
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Team Performance Comparison
            </h3>
            <div className="space-y-4">
              {memberStats.map((member: any, i: number) => {
                const rating = kpiColor(member.kpi.overallScore)
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-48 min-w-0">
                      <span className="text-xs text-slate-600 w-4 shrink-0">#{i + 1}</span>
                      <Avatar size="sm">
                        {member.avatar_url
                          ? <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          : <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        }
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{member.full_name}</p>
                        <p className="text-xs text-slate-500">{member.taskCount} tasks</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">KPI Score</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-bold', rating.text)}>
                            Grade {rating.grade}
                          </span>
                          <Badge variant={rating.badge} className="text-xs">
                            {member.kpi.overallScore}%
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={member.kpi.overallScore}
                        size="sm"
                        color={member.kpi.overallScore >= 80 ? 'emerald' : member.kpi.overallScore >= 65 ? 'indigo' : 'amber'}
                      />
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