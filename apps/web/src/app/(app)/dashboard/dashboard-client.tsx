// apps/web/src/app/(app)/dashboard/dashboard-client.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, FolderKanban, Target, ArrowRight,
  BarChart3, Zap, Activity, ClipboardCheck, FileText, CheckCircle2, MessageSquare,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn, formatDate } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/onboarding-checklist'
import AnimatedCounter from '@/components/motion/animated-counter'
import TiltCard from '@/components/motion/tilt-card'
import ScrollReveal from '@/components/motion/scroll-reveal'
import { ACTION_LABELS } from '@/lib/activity-labels'
import { ease, spring } from '@/lib/motion'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const PRIORITY: Record<string, string> = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#94A3B8' }
const STATUS_COLOR: Record<string, string> = { not_started: '#94A3B8', in_progress: '#60A5FA', blocked: '#F87171', review: '#A78BFA', done: '#34D399' }
const STATUS_LABEL: Record<string, string> = { not_started: 'Not started', in_progress: 'In progress', blocked: 'Blocked', review: 'In review', done: 'Done' }

const container = { initial: {}, animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }
const item = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.expo } } }

function Ring({ value, color }: { value: number; color: string }) {
  const r = 54, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 128 128" className="w-36 h-36 sm:w-40 sm:h-40 -rotate-90" aria-hidden="true">
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
      <motion.circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 1.4, ease: ease.expo, delay: 0.3 }} style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
    </svg>
  )
}

export default function DashboardClient({
  user, workspaceId, onboardingCompleted, onboardingSteps,
}: {
  user: any; workspaceId: string; onboardingCompleted: boolean; onboardingSteps: Record<string, boolean>
}) {
  const reduced = useReducedMotion()
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[] | null>(null)
  const [loggedToday, setLoggedToday] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      const [tr, pr, ar, ap, sl] = await Promise.allSettled([
        fetch('/api/tasks'), fetch('/api/projects'), fetch('/api/activity?limit=10'),
        fetch('/api/approvals'), fetch(`/api/standup?date=${today}`),
      ])
      if (tr.status === 'fulfilled' && tr.value.ok) setTasks((await tr.value.json()).tasks ?? [])
      if (pr.status === 'fulfilled' && pr.value.ok) setProjects((await pr.value.json()).projects ?? [])
      if (ar.status === 'fulfilled' && ar.value.ok) setActivity((await ar.value.json()).activity ?? [])
      if (ap.status === 'fulfilled' && ap.value.ok) setApprovals((await ap.value.json()).approvals ?? [])
      if (sl.status === 'fulfilled' && sl.value.ok) {
        const logs = (await sl.value.json()).logs ?? []
        setLoggedToday(logs.some((l: any) => l.user_id === user?.id))
      }
    } catch (error) {
      console.error('Failed fetching data stream:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = useMemo(() => ({
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }), [tasks])

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  const ringColor = completionRate >= 80 ? '#34D399' : completionRate >= 50 ? '#818CF8' : '#F59E0B'
  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 6)
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 4)
  const isManager = user?.roleLevel <= 2
  const pendingForMe = (approvals ?? []).filter(a => a.status === 'pending' && (isManager ? a.requester_id !== user?.id : a.requester_id === user?.id))
  const firstName = (user?.fullName ?? '').split(' ')[0] || 'there'

  const alerts = [
    stats.blocked > 0 && { href: '/tasks', text: `${stats.blocked} blocked task${stats.blocked > 1 ? 's' : ''}`, color: '#F87171' },
    stats.overdue > 0 && { href: '/tasks', text: `${stats.overdue} overdue`, color: '#FB923C' },
    isManager && pendingForMe.length > 0 && { href: '/approvals', text: `${pendingForMe.length} awaiting your approval`, color: '#FBBF24' },
  ].filter(Boolean) as { href: string; text: string; color: string }[]

  const tiles = [
    { label: 'Total tasks', value: stats.total, icon: CheckSquare, color: '#818CF8', sub: `${completionRate}% complete` },
    { label: 'In progress', value: stats.inProgress, icon: Clock, color: '#60A5FA', sub: 'Active right now' },
    { label: 'Blocked', value: stats.blocked, icon: AlertTriangle, color: '#F87171', sub: stats.blocked > 0 ? 'Needs attention' : 'All clear' },
    { label: 'Completed', value: stats.done, icon: TrendingUp, color: '#34D399', sub: stats.overdue > 0 ? `${stats.overdue} overdue` : 'On track' },
  ]

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-10">
      {!onboardingCompleted && <div className="mb-6"><OnboardingChecklist workspaceId={workspaceId} steps={onboardingSteps} /></div>}

      <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" /></span>
              {getGreeting()} · {format(new Date(), 'EEEE, d MMMM')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
              {firstName}<span className="gradient-text">.</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{user?.workspaceName} · {user?.roleName}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isManager && (
              <Link href="/analytics" className="flex-1 sm:flex-none h-11 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
                <BarChart3 className="w-4 h-4" />Analytics
              </Link>
            )}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="flex-1 sm:flex-none">
              <Link href="/tasks/new" className="btn-shine h-11 px-5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 8px 22px rgba(99,102,241,.35)' }}>
                <Plus className="w-4 h-4" />New task
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Attention strip */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div variants={item} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2">
              {alerts.map((a, i) => (
                <motion.div key={a.text} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.08, ...spring.snappy }}>
                  <Link href={a.href} className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold" style={{ background: `${a.color}1f`, color: a.color, border: `1px solid ${a.color}55` }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: a.color }} />{a.text}<ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero: ring + tiles */}
        <motion.div variants={item} className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 rounded-3xl p-6 border relative overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: ringColor }} aria-hidden="true" />
            <p className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>Delivery rate</p>
            <div className="relative flex items-center gap-5">
              <div className="relative shrink-0">
                <Ring value={completionRate} color={ringColor} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}><AnimatedCounter value={completionRate} suffix="%" /></span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {stats.total === 0 ? 'Add your first task to start tracking.' : completionRate >= 80 ? 'Excellent pace.' : completionRate >= 50 ? 'Good momentum.' : 'Room to move faster.'}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{stats.done} of {stats.total} tasks completed</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            {tiles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08, duration: 0.6, ease: ease.expo }}>
                <TiltCard intensity={reduced ? 0 : 7} glare className="h-full">
                  <div className="h-full rounded-2xl p-5 border relative overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ background: s.color }} aria-hidden="true" />
                    <span className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${s.color}22` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></span>
                    <p className="relative text-4xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{loading ? '–' : <AnimatedCounter value={s.value} />}</p>
                    <p className="relative text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                    <p className="relative text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Work log + approvals nudges */}
        <motion.div variants={item} className="grid sm:grid-cols-2 gap-4">
          <Link href="/standup" className="group rounded-2xl p-5 border flex items-center gap-4 transition-all hover:-translate-y-1 min-h-[88px]"
            style={{ background: loggedToday ? 'color-mix(in srgb, #10B981 10%, var(--bg-surface))' : 'color-mix(in srgb, var(--primary) 12%, var(--bg-surface))', borderColor: loggedToday ? 'rgba(16,185,129,.4)' : 'color-mix(in srgb, var(--primary) 45%, transparent)' }}>
            <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: loggedToday ? 'rgba(16,185,129,.2)' : 'color-mix(in srgb, var(--primary) 22%, transparent)' }}>
              {loggedToday ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{loggedToday ? 'Work log submitted' : 'Log today’s work'}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{loggedToday ? 'Your team can see what you did today.' : 'Takes about a minute. Share progress and blockers.'}</p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <Link href="/approvals" className="group rounded-2xl p-5 border flex items-center gap-4 transition-all hover:-translate-y-1 min-h-[88px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'rgba(245,158,11,.18)' }}>
              <ClipboardCheck className="w-6 h-6 text-amber-400" />
              {pendingForMe.length > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[11px] font-black text-white flex items-center justify-center bg-red-500">{pendingForMe.length}</motion.span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Approvals</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{approvals === null ? 'Review and raise requests.' : pendingForMe.length > 0 ? (isManager ? `${pendingForMe.length} waiting for your decision` : `${pendingForMe.length} of your requests pending`) : 'Nothing waiting right now.'}</p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-secondary)' }} />
          </Link>
        </motion.div>

        {/* Tasks + side column */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ScrollReveal className="lg:col-span-2">
            <section className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><CheckSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />Active tasks</h2>
                <Link href="/tasks" className="text-sm font-bold flex items-center gap-1 min-h-[40px]" style={{ color: 'var(--primary)' }}>View all <ArrowRight className="w-4 h-4" /></Link>
              </header>
              {loading ? <div className="p-4 space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
                : activeTasks.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}><CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" /></motion.div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>You’re all caught up</p>
                    <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>No open tasks. Create one to keep the momentum.</p>
                    <Link href="/tasks/new" className="inline-flex h-11 px-5 rounded-xl text-sm font-bold text-white items-center gap-2" style={{ background: 'var(--primary)' }}><Plus className="w-4 h-4" />New task</Link>
                  </div>
                ) : (
                  <ul>
                    {activeTasks.map((task, i) => {
                      const late = task.due_date && new Date(task.due_date) < new Date()
                      return (
                        <motion.li key={task.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, ease: ease.out }}>
                          <Link href={`/tasks/${task.id}`} className="flex items-center gap-3 px-5 py-3.5 min-h-[60px] border-b last:border-0 hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PRIORITY[task.priority] ?? '#94A3B8' }} aria-label={`Priority ${task.priority}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                              {task.due_date && <p className="text-xs mt-0.5" style={{ color: late ? '#F87171' : 'var(--text-secondary)' }}>{late ? 'Overdue · ' : 'Due '}{formatDate(task.due_date)}</p>}
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: `${STATUS_COLOR[task.status] ?? '#94A3B8'}22`, color: STATUS_COLOR[task.status] ?? '#94A3B8' }}>{STATUS_LABEL[task.status] ?? task.status}</span>
                          </Link>
                        </motion.li>
                      )
                    })}
                  </ul>
                )}
            </section>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal delay={0.05}>
              <section className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><FolderKanban className="w-4 h-4" style={{ color: 'var(--primary)' }} />Projects</h2>
                  <Link href="/projects" className="text-sm font-bold min-h-[40px] flex items-center" style={{ color: 'var(--primary)' }}>All</Link>
                </header>
                {activeProjects.length === 0 ? (
                  <div className="py-10 px-6 text-center"><p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No active projects yet.</p><Link href="/projects/new" className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Create a project</Link></div>
                ) : (
                  <ul className="p-2">
                    {activeProjects.map((p, i) => (
                      <li key={p.id}>
                        <Link href={`/projects/${p.id}`} className="block px-3 py-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors min-h-[56px]">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color ?? 'var(--primary)' }} />
                            <span className="text-[15px] font-semibold truncate flex-1" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{p.progress ?? 0}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                            <motion.div className="h-full rounded-full origin-left" style={{ background: p.color ?? 'var(--primary)' }} initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(100, p.progress ?? 0) / 100 }} transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: ease.expo }} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <section className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-secondary)' }}>Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/tasks/new', icon: Plus, label: 'New task', color: '#818CF8' },
                    { href: '/standup', icon: FileText, label: 'Work log', color: '#34D399' },
                    { href: '/approvals', icon: ClipboardCheck, label: 'Request', color: '#FBBF24' },
                    { href: '/goals', icon: Target, label: 'Goals', color: '#F472B6' },
                    { href: '/projects/new', icon: FolderKanban, label: 'Project', color: '#A78BFA' },
                    { href: '/chat', icon: MessageSquare, label: 'Chat', color: '#22D3EE' },
                  ].map(a => (
                    <motion.div key={a.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>
                      <Link href={a.href} className="flex flex-col items-center justify-center gap-2 rounded-xl py-4 min-h-[80px] border transition-colors hover:bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border)' }}>
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${a.color}22` }}><a.icon className="w-4 h-4" style={{ color: a.color }} /></span>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </div>
        </div>

        {isManager && activity.length > 0 && (
          <ScrollReveal>
            <section className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />Recent activity</h2>
                {user?.roleLevel <= 1 && <Link href="/audit" className="text-sm font-bold min-h-[40px] flex items-center gap-1" style={{ color: 'var(--primary)' }}>Audit trail <ArrowRight className="w-4 h-4" /></Link>}
              </header>
              <ul className="p-3">
                {activity.slice(0, 8).map((log: any, i: number) => (
                  <motion.li key={log.id ?? i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
                    <p className="text-sm leading-relaxed min-w-0" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{log.user?.full_name ?? 'Someone'}</span>{' '}
                      {(ACTION_LABELS[log.action] ?? log.action ?? 'did something').toLowerCase()}{log.entity_title ? <> <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>“{log.entity_title}”</span></> : null}
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}</span>
                    </p>
                  </motion.li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        )}
      </motion.div>
    </div>
  )
}