// apps/web/src/app/(app)/tasks/[id]/task-detail-client.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Circle,
  Edit3, Save, X, Trash2, Flag, Calendar, User,
  FolderKanban, MessageSquare, Activity, Loader2,
  ChevronDown, Send, ShieldAlert, CheckCheck, Tag,
  MoreHorizontal,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'review', label: 'In Review', icon: CheckCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { value: 'blocked', label: 'Blocked', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { value: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-500', dot: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'text-orange-500', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500', dot: 'bg-amber-400' },
  { value: 'low', label: 'Low', color: 'text-slate-400', dot: 'bg-slate-400' },
]

const BLOCKER_CATEGORIES = [
  'Waiting on external', 'Dependency blocked', 'Resource constraint',
  'Unclear requirements', 'Technical blocker', 'Approval needed', 'Other',
]

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('created')) return <div className="w-2 h-2 rounded-full bg-emerald-500" />
  if (action.includes('completed')) return <div className="w-2 h-2 rounded-full bg-emerald-500" />
  if (action.includes('status')) return <div className="w-2 h-2 rounded-full bg-blue-500" />
  if (action.includes('blocked')) return <div className="w-2 h-2 rounded-full bg-red-500" />
  if (action.includes('resolved')) return <div className="w-2 h-2 rounded-full bg-purple-500" />
  if (action.includes('commented')) return <div className="w-2 h-2 rounded-full bg-indigo-500" />
  if (action.includes('assigned')) return <div className="w-2 h-2 rounded-full bg-amber-500" />
  return <div className="w-2 h-2 rounded-full bg-slate-500" />
}

function activityLabel(log: any): string {
  const name = log.user?.full_name ?? 'Someone'
  const meta = log.metadata ?? {}
  switch (log.action) {
    case 'task_created': return `${name} created this task`
    case 'task_updated': return `${name} updated ${(meta.fields as string[] ?? []).join(', ')}`
    case 'task_status_changed': return `${name} moved to ${(meta.newStatus as string ?? '').replace(/_/g, ' ')}`
    case 'task_completed': return `${name} marked this task done`
    case 'task_assigned': return `${name} reassigned this task`
    case 'blocker_added': return `${name} flagged a blocker: ${meta.reason}`
    case 'blocker_resolved': return `${name} resolved the blocker`
    case 'task_commented': return `${name} left a comment`
    default: return `${name} updated this task`
  }
}

type Tab = 'comments' | 'activity'

export default function TaskDetailClient({ taskId, user }: { taskId: string; user: any }) {
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState<Tab>('comments')
  const [comment, setComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showBlockerForm, setShowBlockerForm] = useState(false)
  const [blockerReason, setBlockerReason] = useState('')
  const [blockerCategory, setBlockerCategory] = useState('')
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const fetchTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`)
    if (!res.ok) { toast.error('Task not found'); router.push('/tasks'); return }
    const { task: t, comments: c, activity: a } = await res.json()
    setTask(t)
    setComments(c ?? [])
    setActivity(a ?? [])
    setEditValues({
      title: t.title,
      description: t.description ?? '',
    })
  }, [taskId])

  useEffect(() => {
    Promise.all([
      fetchTask(),
      fetch('/api/projects').then(r => r.json()).then(({ projects: p }) => setProjects(p ?? [])),
      supabase.from('users').select('id, full_name, avatar_url').eq('workspace_id', user.workspaceId)
        .then(({ data }) => setMembers(data ?? [])),
    ]).finally(() => setLoading(false))
  }, [fetchTask])

  // Real-time comments – cast supabase to any throughout
  useEffect(() => {
    if (!task) return
    const channel = (supabase as any)
      .channel(`task-${taskId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'task_comments',
        filter: `task_id=eq.${taskId}`,
      }, async (payload) => {
        // Cast supabase to any here as well
        const { data } = await (supabase as any)
          .from('task_comments')
          .select('*, user:users!task_comments_user_id_fkey(id, full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) setComments(prev => [...prev, data])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [task, taskId])

  async function updateTask(field: string, value: any) {
    setSaving(true)
    const bodyKey: Record<string, string> = {
      status: 'status', priority: 'priority', assigned_to: 'assignedTo',
      project_id: 'projectId', due_date: 'dueDate', title: 'title',
      description: 'description', progress: 'progress',
    }
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [bodyKey[field] ?? field]: value }),
    })
    if (res.ok) {
      const { task: updated } = await res.json()
      setTask(updated)
      await fetchTask()
      toast.success('Updated')
    } else {
      toast.error('Update failed')
    }
    setSaving(false)
    setEditingField(null)
  }

  async function resolveBlocker() {
    await updateTask('blockerReason', null)
    await updateTask('status', 'in_progress')
    setShowBlockerForm(false)
    toast.success('Blocker resolved')
  }

  async function addBlocker() {
    if (!blockerReason.trim()) { toast.error('Describe the blocker'); return }
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'blocked', blockerReason: blockerReason.trim(), blockerCategory }),
    })
    setTask((prev: any) => ({ ...prev, status: 'blocked', blocker_reason: blockerReason, blocker_category: blockerCategory }))
    setShowBlockerForm(false)
    setBlockerReason('')
    setBlockerCategory('')
    await fetchTask()
    toast.success('Blocker flagged')
  }

  async function sendComment() {
    if (!comment.trim()) return
    setSendingComment(true)
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment.trim() }),
    })
    if (res.ok) {
      setComment('')
      toast.success('Comment added')
    } else {
      toast.error('Failed to send comment')
    }
    setSendingComment(false)
  }

  async function deleteTask() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Task deleted')
      router.push('/tasks')
    } else {
      toast.error('Failed to delete task')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  if (!task) return null

  const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status) ?? STATUS_OPTIONS[0]
  const priorityOpt = PRIORITY_OPTIONS.find(p => p.value === task.priority) ?? PRIORITY_OPTIONS[2]
  const StatusIcon = statusOpt.icon
  const isBlocked = task.status === 'blocked'
  const isDone = task.status === 'done'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Back nav */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tasks"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" />
          Tasks
        </Link>
        {task.project && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <Link href={`/projects/${task.project.id}`}
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: task.project.color }} />
              {task.project.name}
            </Link>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Blocked banner */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-500 mb-0.5">Blocked</p>
                {task.blocker_category && (
                  <p className="text-xs text-red-400/70 mb-1">{task.blocker_category}</p>
                )}
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.blocker_reason}</p>
              </div>
              {user.roleLevel <= 3 && (
                <button onClick={resolveBlocker}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                  Resolve
                </button>
              )}
            </motion.div>
          )}

          {/* Title */}
          <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {editingField === 'title' ? (
              <div className="space-y-3">
                <input
                  value={editValues.title}
                  onChange={e => setEditValues(p => ({ ...p, title: e.target.value }))}
                  className="w-full text-2xl font-bold bg-transparent outline-none border-b-2 border-indigo-500 pb-1"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') updateTask('title', editValues.title)
                    if (e.key === 'Escape') setEditingField(null)
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => updateTask('title', editValues.title)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ background: 'var(--primary)' }}>
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingField(null)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group flex items-start gap-3">
                <button
                  onClick={() => updateTask('status', isDone ? 'not_started' : 'done')}
                  className={cn('mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                    isDone ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                  )}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <h1
                  className={cn('text-2xl font-bold flex-1 leading-tight cursor-pointer',
                    isDone && 'line-through opacity-60'
                  )}
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setEditingField('title')}
                >
                  {task.title}
                </h1>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setEditingField('title')}
                      className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[var(--bg-elevated)]"
                      style={{ color: 'var(--text-muted)' }}>
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit title</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Description */}
            <div className="mt-5 group">
              {editingField === 'description' ? (
                <div className="space-y-3">
                  <textarea
                    value={editValues.description}
                    onChange={e => setEditValues(p => ({ ...p, description: e.target.value }))}
                    rows={5}
                    placeholder="Add a description..."
                    className="w-full text-sm rounded-xl border p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateTask('description', editValues.description)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                      style={{ background: 'var(--primary)' }}>
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setEditingField(null)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingField('description')}
                  className="cursor-pointer text-sm leading-relaxed min-h-[3rem] rounded-xl p-3 transition-colors"
                  style={{ color: task.description ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                >
                  {task.description || (
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Add a description...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{task.progress ?? 0}%</span>
              </div>
              <input
                type="range"
                min={0} max={100} step={5}
                value={task.progress ?? 0}
                onChange={e => setTask((p: any) => ({ ...p, progress: Number(e.target.value) }))}
                onMouseUp={e => updateTask('progress', Number((e.target as HTMLInputElement).value))}
                onTouchEnd={e => updateTask('progress', Number((e.target as HTMLInputElement).value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>
          </div>

          {/* Blocker form */}
          <AnimatePresence>
            {showBlockerForm && !isBlocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 overflow-hidden"
              >
                <p className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Flag a blocker
                </p>
                <select
                  value={blockerCategory}
                  onChange={e => setBlockerCategory(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select category</option>
                  {BLOCKER_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <textarea
                  value={blockerReason}
                  onChange={e => setBlockerReason(e.target.value)}
                  rows={3}
                  placeholder="Describe what is blocking this task..."
                  className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-2">
                  <button onClick={addBlocker}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition">
                    Flag as blocked
                  </button>
                  <button onClick={() => setShowBlockerForm(false)}
                    className="px-4 py-2 rounded-xl text-sm border transition"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comments + Activity tabs */}
          <div className="rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
              {([['comments', 'Comments', MessageSquare], ['activity', 'Activity', Activity]] as const).map(([t, label, Icon]) => (
                <button
                  key={t}
                  onClick={() => setTab(t as Tab)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2',
                    tab === t ? 'border-indigo-500' : 'border-transparent'
                  )}
                  style={{
                    color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
                    borderBottomColor: tab === t ? 'var(--primary)' : 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {t === 'comments' && comments.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {comments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'comments' && (
                <div className="space-y-4">
                  {comments.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Start the conversation.</p>
                    </div>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar size="sm" className="shrink-0 mt-0.5">
                        {c.user?.avatar_url
                          ? <AvatarImage src={c.user.avatar_url} alt={c.user.full_name} />
                          : <AvatarFallback>{getInitials(c.user?.full_name ?? '?')}</AvatarFallback>
                        }
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {c.user?.full_name}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-sm rounded-2xl rounded-tl-sm px-4 py-3"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Comment input */}
                  <div className="flex gap-3 pt-2">
                    <Avatar size="sm" className="shrink-0 mt-0.5">
                      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <textarea
                        ref={commentRef}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment()
                        }}
                        className="w-full rounded-2xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cmd+Enter to send</span>
                        <button
                          onClick={sendComment}
                          disabled={!comment.trim() || sendingComment}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition disabled:opacity-50"
                          style={{ background: 'var(--primary)' }}
                        >
                          {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3">
                  {activity.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>
                    </div>
                  )}
                  {activity.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1.5">
                        <ActivityIcon action={log.action} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{activityLabel(log)}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Status</p>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn('w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all', statusOpt.bg)}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('w-4 h-4', statusOpt.color)} />
                  <span className={statusOpt.color}>{statusOpt.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-xl overflow-hidden"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { updateTask('status', opt.value); setShowStatusMenu(false) }}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left hover:bg-[var(--bg-overlay)]',
                          task.status === opt.value && 'font-semibold'
                        )}
                      >
                        <opt.icon className={cn('w-4 h-4', opt.color)} />
                        <span className={opt.color}>{opt.label}</span>
                        {task.status === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Priority */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Priority</p>
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', priorityOpt.dot)} />
                  <span className={priorityOpt.color}>{priorityOpt.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
              <AnimatePresence>
                {showPriorityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-xl overflow-hidden"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { updateTask('priority', opt.value); setShowPriorityMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left hover:bg-[var(--bg-overlay)]"
                      >
                        <div className={cn('w-2.5 h-2.5 rounded-full', opt.dot)} />
                        <span className={opt.color}>{opt.label}</span>
                        {task.priority === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Assignee */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Assignee</p>
            <select
              value={task.assigned_to ?? ''}
              onChange={e => updateTask('assigned_to', e.target.value || null)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            {task.assignee && (
              <div className="flex items-center gap-2 mt-2.5">
                <Avatar size="xs">
                  {task.assignee.avatar_url
                    ? <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name} />
                    : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>
                  }
                </Avatar>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assignee.full_name}</span>
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Due Date</p>
            <input
              type="date"
              value={task.due_date ? task.due_date.split('T')[0] : ''}
              onChange={e => updateTask('due_date', e.target.value || null)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            {task.due_date && (
              <p className={cn('text-xs mt-1.5', new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : '')}
                style={new Date(task.due_date) >= new Date() || task.status === 'done' ? { color: 'var(--text-muted)' } : undefined}>
                {formatDate(task.due_date)}
              </p>
            )}
          </div>

          {/* Project */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Project</p>
            <select
              value={task.project_id ?? ''}
              onChange={e => updateTask('project_id', e.target.value || null)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border p-4 space-y-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Actions</p>
            {!isBlocked && (
              <button
                onClick={() => setShowBlockerForm(!showBlockerForm)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Flag as blocked
              </button>
            )}
            {isBlocked && (
              <button
                onClick={resolveBlocker}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 transition"
              >
                <CheckCheck className="w-4 h-4" />
                Resolve blocker
              </button>
            )}
            <button
              onClick={deleteTask}
              disabled={deleting}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                border border-red-500/20 text-red-500 hover:bg-red-500/5 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete task
            </button>
          </div>

          {/* Meta info */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Details</p>
            <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span>{formatDate(task.created_at)}</span>
              </div>
              {task.completed_at && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                  <span className="text-emerald-500">{formatDate(task.completed_at)}</span>
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Estimated</span>
                  <span>{task.estimated_hours}h</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}