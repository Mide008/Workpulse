'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Clock, AlertTriangle,
  CheckCircle2, Circle, Users, Calendar,
  Edit2, Trash2, ChevronDown, MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { staggerItem } from '@/lib/motion'

const statusConfig: Record<string, { label: string; color: string; icon: any; badge: BadgeVariant }> = {
  not_started: { label: 'Not Started', color: 'text-slate-400', icon: Circle, badge: 'default' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', icon: Clock, badge: 'info' },
  blocked:     { label: 'Blocked', color: 'text-red-400', icon: AlertTriangle, badge: 'danger' },
  review:      { label: 'In Review', color: 'text-purple-400', icon: Clock, badge: 'purple' },
  done:        { label: 'Done', color: 'text-emerald-400', icon: CheckCircle2, badge: 'success' },
}

const BOARD_COLUMNS = ['not_started', 'in_progress', 'review', 'blocked', 'done'] as const

export default function ProjectDetailClient({ project: initialProject, currentUser, workspaceMembers }: {
  project: any
  currentUser: any
  workspaceMembers: any[]
}) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [view, setView] = useState<'board' | 'list'>('board')

  const tasks = project.tasks ?? []
  const members = (project.project_members ?? []).map((pm: any) => pm.user).filter(Boolean)

  const stats = {
    total: tasks.length,
    done: tasks.filter((t: any) => t.status === 'done').length,
    blocked: tasks.filter((t: any) => t.status === 'blocked').length,
    inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
  }

  async function updateProject(updates: Record<string, any>) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) { toast.error('Failed to update project'); return }
    const { project: updated } = await res.json()
    setProject((p: any) => ({ ...p, ...updated }))
    toast.success('Project updated')
  }

  async function deleteProject() {
    if (!confirm('Delete this project? All tasks will be unlinked.')) return
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    toast.success('Project deleted')
    router.push('/projects')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/projects"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white
          text-sm transition group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        All projects
      </Link>

      {/* Project header */}
      <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white
                font-bold text-lg shrink-0"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-slate-400 text-sm mt-1 max-w-xl">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="relative">
                  <select
                    value={project.status}
                    onChange={e => updateProject({ status: e.target.value })}
                    className="appearance-none bg-white/[0.04] border border-white/10 rounded-lg
                      pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none
                      focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
                {project.end_date && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.end_date)}
                  </span>
                )}
                <AvatarGroup
                  avatars={members.map((m: any) => ({
                    name: m.full_name,
                    avatarUrl: m.avatar_url,
                    color: project.color,
                  }))}
                  max={5}
                  size="xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/tasks/new?projectId=${project.id}`}>
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Add Task
              </Button>
            </Link>
            <Button variant="ghost" size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-400" />}
              onClick={deleteProject}
              className="text-red-400 hover:bg-red-500/10"
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
            { label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
            { label: 'Done', value: stats.done, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-500">Overall progress</span>
            <span className="text-xs font-semibold text-white">{project.progress}%</span>
          </div>
          <Progress value={project.progress} size="md" animated />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        {(['board', 'list'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              view === v
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {v} view
          </button>
        ))}
      </div>

      {/* Board / List */}
      <AnimatePresence mode="wait">
        {view === 'board' ? (
          <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {BOARD_COLUMNS.map(col => {
                const colTasks = tasks.filter((t: any) => t.status === col)
                const cfg = statusConfig[col]
                const ColIcon = cfg.icon
                return (
                  <div key={col} className="flex-shrink-0 w-72">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <ColIcon className={cn('w-4 h-4', cfg.color)} />
                      <span className="text-sm font-medium text-slate-300">{cfg.label}</span>
                      <span className="ml-auto text-xs text-slate-500 bg-white/5
                        px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.map((task: any, i: number) => (
                        <motion.div
                          key={task.id}
                          variants={staggerItem}
                          initial="initial"
                          animate="animate"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <Link href={`/tasks/${task.id}`}>
                            <div className={cn(
                              'p-4 rounded-xl cursor-pointer group',
                              'bg-slate-900/80 border border-white/[0.06]',
                              'hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5',
                              'transition-all duration-200',
                              task.status === 'blocked' && 'border-red-500/20'
                            )}>
                              <p className={cn(
                                'text-sm font-medium leading-snug mb-2',
                                task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'
                              )}>
                                {task.title}
                              </p>
                              {task.blocker_reason && (
                                <div className="flex items-center gap-1.5 mb-2 text-xs
                                  text-red-400 bg-red-500/10 px-2 py-1.5 rounded-lg">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{task.blocker_reason}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                {task.due_date && (
                                  <span className={cn(
                                    'text-xs',
                                    new Date(task.due_date) < new Date() && task.status !== 'done'
                                      ? 'text-red-400'
                                      : 'text-slate-600'
                                  )}>
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                                {task.assignee && (
                                  <Avatar size="xs" className="ml-auto">
                                    {task.assignee.avatar_url
                                      ? <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name} />
                                      : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>
                                    }
                                  </Avatar>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="h-20 rounded-xl border border-dashed border-white/[0.06]
                          flex items-center justify-center">
                          <p className="text-xs text-slate-700">No tasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-1.5">
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-500">No tasks yet</p>
                  <Link href={`/tasks/new?projectId=${project.id}`}>
                    <Button variant="secondary" size="sm" className="mt-3"
                      icon={<Plus className="w-3.5 h-3.5" />}>
                      Add first task
                    </Button>
                  </Link>
                </div>
              ) : tasks.map((task: any) => {
                const cfg = statusConfig[task.status] ?? statusConfig.not_started
                const TaskIcon = cfg.icon
                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                      bg-white/[0.02] border border-transparent
                      hover:bg-white/[0.05] hover:border-white/[0.08] transition-all group">
                      <TaskIcon className={cn('w-4 h-4 shrink-0', cfg.color)} />
                      <span className={cn(
                        'flex-1 text-sm truncate',
                        task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'
                      )}>
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className={cn(
                          'text-xs shrink-0',
                          new Date(task.due_date) < new Date() && task.status !== 'done'
                            ? 'text-red-400' : 'text-slate-600'
                        )}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.assignee && (
                        <Avatar size="xs">
                          {task.assignee.avatar_url
                            ? <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name} />
                            : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>
                          }
                        </Avatar>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}