// apps/web/src/app/(app)/projects/[id]/project-detail-client.tsx
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plus, CheckCircle2, Clock, AlertTriangle,
  Circle, CheckCheck, Users, Activity, MoreHorizontal,
  Edit3, Save, X, Trash2, Calendar, TrendingUp, Loader2,
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  not_started: 'text-slate-400', in_progress: 'text-blue-500',
  review: 'text-purple-500', blocked: 'text-red-500', done: 'text-emerald-500',
}

const STATUS_BG: Record<string, string> = {
  not_started: 'bg-slate-400/10', in_progress: 'bg-blue-500/10',
  review: 'bg-purple-500/10', blocked: 'bg-red-500/10', done: 'bg-emerald-500/10',
}

const STATUS_ICONS: Record<string, any> = {
  not_started: Circle, in_progress: Clock, review: CheckCheck,
  blocked: AlertTriangle, done: CheckCircle2,
}

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled']

export default function ProjectDetailClient({ project: initial, tasks, members, activity, user }: {
  project: any; tasks: any[]; members: any[]; activity: any[]; user: any
}) {
  const router = useRouter()
  const [project, setProject] = useState(initial)
  const [taskList, setTaskList] = useState(tasks)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(initial.name)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'activity'>('tasks')
  const [showAddMember, setShowAddMember] = useState(false)
  const [addingMember, setAddingMember] = useState('')
  const [taskFilter, setTaskFilter] = useState('all')

  const stats = {
    total: taskList.length,
    done: taskList.filter(t => t.status === 'done').length,
    inProgress: taskList.filter(t => t.status === 'in_progress').length,
    blocked: taskList.filter(t => t.status === 'blocked').length,
  }

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  async function saveName() {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setProject((p: any) => ({ ...p, name: editName.trim() }))
      toast.success('Project updated')
    } else toast.error('Update failed')
    setSaving(false)
    setEditingName(false)
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setProject((p: any) => ({ ...p, status }))
  }

  async function addMember() {
    if (!addingMember) return
    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: addingMember }),
    })
    if (res.ok) {
      const member = members.find(m => m.id === addingMember)
      if (member) {
        setProject((p: any) => ({
          ...p,
          project_members: [...(p.project_members ?? []), { user_id: member.id, user: member }],
        }))
      }
      setShowAddMember(false)
      setAddingMember('')
      toast.success('Member added')
    }
  }

  const filteredTasks = taskFilter === 'all' ? taskList : taskList.filter(t => t.status === taskFilter)

  const projectMembers = (project.project_members ?? []).map((pm: any) => pm.user).filter(Boolean)
  const nonMembers = members.filter(m => !projectMembers.find((pm: any) => pm.id === m.id))

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Back */}
      <Link href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" />
        Projects
      </Link>

      {/* Project header */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold text-xl"
            style={{ background: project.color ?? 'var(--primary)' }}>
            {project.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  className="text-2xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none flex-1"
                  style={{ color: 'var(--text-primary)' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                />
                <button onClick={saveName} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                  style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 group">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h1>
                <button onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[var(--bg-elevated)]"
                  style={{ color: 'var(--text-muted)' }}>
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            {project.description && (
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={project.status}
                onChange={e => updateStatus(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border capitalize cursor-pointer focus:outline-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {PROJECT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>

              {project.end_date && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  Due {formatDate(project.end_date)}
                </div>
              )}

              <div className="flex items-center gap-1 flex-wrap">
                {projectMembers.slice(0, 5).map((m: any) => (
                  <Avatar key={m.id} size="xs">
                    {m.avatar_url
                      ? <AvatarImage src={m.avatar_url} alt={m.full_name} />
                      : <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>
                    }
                  </Avatar>
                ))}
                {projectMembers.length > 5 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{projectMembers.length - 5}</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <div className="text-center shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none"
                  stroke={project.color ?? 'var(--primary)'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Complete</p>
          </div>
        </div>

        {/* Stat bar */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
            { label: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
            { label: 'Blocked', value: stats.blocked, color: '#EF4444' },
            { label: 'Done', value: stats.done, color: '#10B981' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-5" style={{ borderColor: 'var(--border)' }}>
        {([['tasks', 'Tasks', taskList.length], ['members', 'Members', projectMembers.length], ['activity', 'Activity', activity.length]] as const).map(([t, label, count]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all"
            style={{
              color: activeTab === t ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === t ? 'var(--primary)' : 'transparent',
            }}
          >
            {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              {['all', 'in_progress', 'blocked', 'done'].map(f => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={taskFilter === f
                    ? { background: 'var(--primary)', color: 'white' }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
            <Link
              href={`/tasks/new?project=${project.id}`}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white transition hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="w-4 h-4" />
              Add task
            </Link>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No tasks {taskFilter !== 'all' ? `with status "${taskFilter.replace('_', ' ')}"` : 'in this project'}</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create the first task to start tracking work.</p>
              <Link href={`/tasks/new?project=${project.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
                style={{ background: 'var(--primary)' }}>
                <Plus className="w-4 h-4" />
                Create task
              </Link>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
              {filteredTasks.map(task => {
                const StatusIcon = STATUS_ICONS[task.status] ?? Circle
                return (
                  <motion.div key={task.id} variants={staggerItem}>
                    <Link href={`/tasks/${task.id}`}>
                      <div className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm hover:-translate-y-0.5"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                        <div className={cn('p-1.5 rounded-lg shrink-0', STATUS_BG[task.status])}>
                          <StatusIcon className={cn('w-4 h-4', STATUS_COLORS[task.status])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', task.status === 'done' && 'line-through opacity-60')}
                            style={{ color: 'var(--text-primary)' }}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className={cn('text-xs mt-0.5', new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : '')}
                              style={new Date(task.due_date) >= new Date() || task.status === 'done' ? { color: 'var(--text-muted)' } : undefined}>
                              Due {formatDate(task.due_date)}
                            </p>
                          )}
                        </div>
                        {task.assignee && (
                          <Avatar size="xs" className="shrink-0">
                            {task.assignee.avatar_url
                              ? <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name} />
                              : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>
                            }
                          </Avatar>
                        )}
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition shrink-0"
                          style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</p>
            {user.roleLevel <= 2 && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
                Add member
              </button>
            )}
          </div>

          {showAddMember && nonMembers.length > 0 && (
            <div className="flex gap-2 mb-4">
              <select value={addingMember} onChange={e => setAddingMember(e.target.value)}
                className="flex-1 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="">Select team member</option>
                {nonMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <button onClick={addMember} className="px-4 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'var(--primary)' }}>
                Add
              </button>
            </div>
          )}

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
            {projectMembers.map((m: any) => (
              <motion.div key={m.id} variants={staggerItem}>
                <div className="flex items-center gap-3 p-4 rounded-2xl border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <Avatar size="md">
                    {m.avatar_url
                      ? <AvatarImage src={m.avatar_url} alt={m.full_name} />
                      : <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>
                    }
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.full_name}</p>
                    {m.job_title && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.job_title}</p>}
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {taskList.filter(t => t.assigned_to === m.id).length} tasks
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activity.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
            </div>
          ) : (
            activity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-4 rounded-2xl border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <Avatar size="xs" className="shrink-0 mt-0.5">
                  {log.user?.avatar_url
                    ? <AvatarImage src={log.user.avatar_url} alt={log.user.full_name} />
                    : <AvatarFallback>{getInitials(log.user?.full_name ?? '?')}</AvatarFallback>
                  }
                </Avatar>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <strong>{log.user?.full_name}</strong>{' '}
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}