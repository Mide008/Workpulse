'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  Plus, FolderKanban, ArrowRight,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const statusBadge: Record<string, BadgeVariant> = {
  not_started: 'default', in_progress: 'info',
  blocked: 'danger', review: 'purple', done: 'success',
}

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500',
  medium: 'bg-amber-400', low: 'bg-slate-400',
}

interface Props {
  user: {
    id: string
    fullName: string
    workspaceName: string
    roleLevel: number
    primaryColor: string
  }
  tasks: any[]
  projects: any[]
}

export default function DashboardClient({ user, tasks, projects }: Props) {
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const recentTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 6)

  const activeProjects = projects
    .filter(p => p.status === 'active' || p.status === 'paused')
    .slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{user.workspaceName}</p>
        </div>
        <Link href="/tasks/new">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            New Task
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-[var(--primary,#6366F1)]', bg: 'bg-[var(--primary,#6366F1)]/10' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Blocked', value: stats.blocked, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Done', value: stats.done, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(stat => (
          <div key={stat.label}
            className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{stat.label}</span>
              <div className={cn('p-2 rounded-xl', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </div>
            <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              Active Tasks
            </h2>
            <Link href="/tasks">
              <Button variant="ghost" size="xs" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                View all
              </Button>
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-10">
              <CheckSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active tasks</p>
              <Link href="/tasks/new">
                <Button variant="secondary" size="xs" className="mt-3" icon={<Plus className="w-3.5 h-3.5" />}>
                  Create task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                    hover:bg-white/5 transition group cursor-pointer">
                    <div className={cn('w-2 h-2 rounded-full shrink-0',
                      priorityDot[task.priority] ?? 'bg-slate-400')} />
                    <span className="flex-1 text-sm text-slate-300 group-hover:text-white
                      transition truncate">
                      {task.title}
                    </span>
                    <Badge variant={statusBadge[task.status] ?? 'default'} className="shrink-0 text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-slate-400" />
              Projects
            </h2>
            <Link href="/projects">
              <Button variant="ghost" size="xs" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                View all
              </Button>
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div className="text-center py-10">
              <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active projects</p>
              <Link href="/projects/new">
                <Button variant="secondary" size="xs" className="mt-3" icon={<Plus className="w-3.5 h-3.5" />}>
                  Create project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="p-3 rounded-xl hover:bg-white/5 transition group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white
                          transition truncate">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0 ml-2">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} size="sm" animated />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}