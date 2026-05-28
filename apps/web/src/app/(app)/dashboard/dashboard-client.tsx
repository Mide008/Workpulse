'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  Plus, FolderKanban, Target, ArrowRight,
  BarChart3, Users, Zap, Calendar,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500',
  medium: 'bg-amber-400', low: 'bg-slate-500',
}

const statusColor: Record<string, string> = {
  not_started: 'text-slate-400', in_progress: 'text-blue-400',
  blocked: 'text-red-400', review: 'text-purple-400', done: 'text-emerald-400',
}

const statusLabel: Record<string, string> = {
  not_started: 'Not Started', in_progress: 'In Progress',
  blocked: 'Blocked', review: 'In Review', done: 'Done',
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { 
    initial: { opacity: 0, y: 16 }, 
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: 'easeOut' as const } 
    } 
  },
}

export default function DashboardClient({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [tr, pr] = await Promise.allSettled([fetch('/api/tasks'), fetch('/api/projects')])
      if (tr.status === 'fulfilled' && tr.value.ok) {
        const { tasks: t } = await tr.value.json()
        setTasks(t ?? [])
      }
      if (pr.status === 'fulfilled' && pr.value.ok) {
        const { projects: p } = await pr.value.json()
        setProjects(p ?? [])
      }
    } catch (error) {
      console.error('Failed fetching data stream:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-slate-400 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-3xl font-bold text-white mt-0.5 tracking-tight">{user?.fullName}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-slate-500 text-sm">{user?.workspaceName} · {user?.roleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <Link href="/analytics">
              <Button variant="secondary" size="sm" icon={<BarChart3 className="w-4 h-4" />}>
                Analytics
              </Button>
            </Link>
          )}
          <Link href="/tasks/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Score Banner — manager only */}
      {isManager && !loading && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-6
            bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-transparent
            border border-indigo-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-8 flex-wrap">
            <div>
              <p className="text-slate-400 text-sm mb-1">Team Completion Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">{completionRate}</span>
                <span className="text-2xl text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="flex-1 min-w-48">
              <Progress value={completionRate} size="lg" color="indigo" animated />
              <div className="flex justify-between mt-1.5 text-xs text-slate-600">
                <span>{stats.done} done</span>
                <span>{stats.total} total</span>
              </div>
            </div>
            {stats.blocked > 0 && (
              <Link href="/analytics" className="flex items-center gap-2 px-4 py-2 rounded-xl
                bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition">
                <AlertTriangle className="w-4 h-4" />
                {stats.blocked} blocked task{stats.blocked > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', sub: `${completionRate}% complete` },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', sub: 'Active right now' },
            { label: 'Blocked', value: stats.blocked, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', sub: stats.blocked > 0 ? 'Needs attention' : 'All clear' },
            { label: 'Completed', value: stats.done, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', sub: stats.overdue > 0 ? `${stats.overdue} overdue` : 'On track' },
          ].map(stat => (
            <motion.div key={stat.label} variants={stagger.item}>
              <div className={cn(
                'p-5 rounded-2xl border bg-slate-900/80 hover:bg-slate-900',
                'transition-all duration-300 hover:-translate-y-0.5',
                stat.border
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full', stat.bg, stat.color)}>
                    {stat.sub}
                  </span>
                </div>
                <p className={cn('text-4xl font-bold', stat.color)}>{stat.value}</p>
                <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main content grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Tasks — wider column */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-white/[0.06] rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-white">Active Tasks</h2>
              {activeTasks.length > 0 && (
                <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                  {activeTasks.length}
                </span>
              )}
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="xs" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                View all
              </Button>
            </Link>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />)}
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">All caught up!</p>
                <p className="text-slate-500 text-sm">No active tasks. Create one to get started.</p>
                <Link href="/tasks/new">
                  <Button variant="secondary" size="sm" className="mt-4" icon={<Plus className="w-3.5 h-3.5" />}>
                    Create task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeTasks.map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="group flex items-center gap-3 px-3 py-3 rounded-xl
                      hover:bg-white/5 transition-all cursor-pointer border border-transparent
                      hover:border-white/[0.08]">
                      <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-0.5',
                        priorityDot[task.priority] ?? 'bg-slate-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white
                          transition truncate">
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className={cn('text-xs mt-0.5 flex items-center gap-1',
                            new Date(task.due_date) < new Date()
                              ? 'text-red-400' : 'text-slate-600')}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <span className={cn('text-xs font-medium shrink-0',
                        statusColor[task.status] ?? 'text-slate-400')}>
                        {statusLabel[task.status] ?? task.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400
                        group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-white">Projects</h2>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="xs" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                  All
                </Button>
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No active projects</p>
                  <Link href="/projects/new">
                    <Button variant="ghost" size="xs" className="mt-2" icon={<Plus className="w-3 h-3" />}>
                      Create project
                    </Button>
                  </Link>
                </div>
              ) : (
                activeProjects.map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="group p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white
                          transition truncate flex-1">
                          {project.name}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} size="sm" animated />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/tasks/new', icon: Plus, label: 'New Task', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { href: '/projects/new', icon: FolderKanban, label: 'New Project', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { href: '/goals', icon: Target, label: 'Goals', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { href: '/chat', icon: Zap, label: 'Chat', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ...(isManager ? [
                  { href: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { href: '/team', icon: Users, label: 'Team', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                ] : []),
              ].map(action => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl
                    hover:bg-white/5 transition-all group cursor-pointer border border-transparent
                    hover:border-white/[0.08]">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', action.bg)}>
                      <action.icon className={cn('w-4 h-4', action.color)} />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition font-medium">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}