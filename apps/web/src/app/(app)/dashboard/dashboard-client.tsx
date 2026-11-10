// apps/web/src/app/(app)/dashboard/dashboard-client.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, FolderKanban, Target, ArrowRight, BarChart3, Users, Zap, Calendar, Activity, ChevronRight
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import OnboardingChecklist from '@/components/dashboard/onboarding-checklist'
import AnimatedCounter from '@/components/motion/animated-counter'
import TiltCard from '@/components/motion/tilt-card'
import { staggerContainer, staggerItem, ease } from '@/lib/motion'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-slate-500',
}

const statusColor: Record<string, string> = {
  not_started: 'text-[var(--text-secondary)]', in_progress: 'text-blue-400',
  blocked: 'text-red-400', review: 'text-purple-400', done: 'text-emerald-400',
}

const statusLabel: Record<string, string> = {
  not_started: 'Not Started', in_progress: 'In Progress',
  blocked: 'Blocked', review: 'In Review', done: 'Done',
}

export default function DashboardClient({
  user, workspaceId, onboardingCompleted, onboardingSteps,
}: {
  user: any; workspaceId: string; onboardingCompleted: boolean; onboardingSteps: Record<string, boolean>
}) {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [tr, pr, ar] = await Promise.allSettled([fetch('/api/tasks'), fetch('/api/projects'), fetch('/api/activity?limit=10')])
      if (tr.status === 'fulfilled' && (tr as any).value.ok) { const { tasks: t } = await (tr as any).value.json(); setTasks(t ?? []) }
      if (pr.status === 'fulfilled' && (pr as any).value.ok) { const { projects: p } = await (pr as any).value.json(); setProjects(p ?? []) }
      if (ar.status === 'fulfilled' && (ar as any).value.ok) { const { activity: a } = await (ar as any).value.json(); setActivity(a ?? []) }
    } catch (error) { console.error('Failed fetching data:', error) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 5)
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 4)
  const isManager = user?.roleLevel <= 2

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-7xl mx-auto space-y-8 pb-12">
      {!onboardingCompleted && <OnboardingChecklist workspaceId={workspaceId} steps={onboardingSteps} />}

      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mt-1 tracking-tight">{user?.fullName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[var(--text-muted)] text-sm font-medium">{user?.workspaceName} · {user?.roleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isManager && <Link href="/analytics"><Button variant="secondary" size="sm" icon={<BarChart3 className="w-4 h-4" />}>Analytics</Button></Link>}
          <Link href="/tasks/new"><Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>New Task</Button></Link>
        </div>
      </motion.div>

      {/* KPI Bento Box */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <TiltCard intensity={4} glare className="h-full">
            <div className="h-full relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent border border-indigo-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="relative flex items-center gap-8 flex-wrap">
                <div>
                  <p className="text-indigo-400 font-bold text-sm mb-2 uppercase tracking-wider">Team Completion</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-[var(--text-primary)]"><AnimatedCounter value={completionRate} /></span>
                    <span className="text-3xl text-[var(--text-secondary)] font-bold">%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="h-2.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <motion.div className="h-full rounded-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 1, ease: ease.expo }} />
                  </div>
                  <div className="flex justify-between mt-3 text-sm font-medium text-[var(--text-muted)]"><span>{stats.done} done</span><span>{stats.total} total</span></div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <TiltCard intensity={8} className="h-full">
            <Link href="/tasks?status=blocked" className="block h-full p-8 rounded-3xl border bg-[var(--bg-surface)] hover:border-red-500/50 transition-colors" style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <h3 className="text-5xl font-black text-[var(--text-primary)]"><AnimatedCounter value={stats.blocked} /></h3>
              <p className="text-base font-bold text-[var(--text-secondary)] mt-2">Blocked Tasks</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Needs immediate attention</p>
            </Link>
          </TiltCard>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: '#6366F1' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: '#3B82F6' },
          { label: 'Completed', value: stats.done, icon: TrendingUp, color: '#10B981' },
          { label: 'Overdue', value: stats.overdue, icon: Calendar, color: '#F59E0B' },
        ].map(stat => (
          <TiltCard key={stat.label} intensity={6}>
            <div className="p-6 rounded-3xl border bg-[var(--bg-surface)] transition-all hover:-translate-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${stat.color}15` }}><stat.icon className="w-5 h-5" style={{ color: stat.color }} /></div>
              <p className="text-4xl font-black text-[var(--text-primary)]"><AnimatedCounter value={stat.value} /></p>
              <p className="text-sm font-bold text-[var(--text-muted)] mt-1">{stat.label}</p>
            </div>
          </TiltCard>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <motion.div variants={staggerItem} className="lg:col-span-2 rounded-3xl border bg-[var(--bg-surface)] overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">My Focus</h2>
            <Link href="/tasks" className="text-sm font-bold text-[var(--primary)] flex items-center gap-1 hover:underline">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {activeTasks.length === 0 ? <div className="p-12 text-center text-[var(--text-muted)]">You're all caught up!</div> : activeTasks.map(task => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-4 p-5 hover:bg-[var(--bg-elevated)] transition-colors group">
                <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', priorityDot[task.priority] ?? 'bg-slate-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{task.title}</p>
                  {task.due_date && <p className={cn('text-xs mt-1 font-medium flex items-center gap-1', new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-[var(--text-muted)]')}><Calendar className="w-3 h-3" />{formatDate(task.due_date)}</p>}
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)]', statusColor[task.status])}>{statusLabel[task.status]}</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          <motion.div variants={staggerItem} className="rounded-3xl border bg-[var(--bg-surface)] p-6" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-[var(--text-primary)]">Projects</h2><Link href="/projects" className="text-sm font-bold text-[var(--primary)]">All</Link></div>
            <div className="space-y-5">
              {activeProjects.length === 0 ? <p className="text-sm text-[var(--text-muted)] text-center py-4">No active projects</p> : activeProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate flex-1">{project.name}</span>
                    <span className="text-xs font-bold text-[var(--text-muted)]">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.color }} /></div>
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="rounded-3xl border bg-[var(--bg-surface)] p-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-[var(--primary)]" /> Recent Activity</h2>
            <div className="space-y-4">
              {activity.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-secondary)] leading-snug"><strong className="text-[var(--text-primary)]">{log.user?.full_name}</strong> {log.action.replace(/_/g, ' ')}{log.entity_title ? ` "${log.entity_title}"` : ''}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}