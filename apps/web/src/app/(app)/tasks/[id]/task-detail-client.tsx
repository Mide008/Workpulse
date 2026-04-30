'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Edit2, Check, X, AlertTriangle,
  Paperclip, MessageSquare, Clock, Calendar,
  ChevronDown, Trash2, Send, CheckCircle2, Circle, Tag,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn, formatDate, timeAgo, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeVariant } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { fadeIn, scaleIn } from '@/lib/motion'

const statusConfig: Record<string, { label: string; badge: BadgeVariant; dot: boolean }> = {
  not_started: { label: 'Not Started', badge: 'default',  dot: false },
  in_progress:  { label: 'In Progress', badge: 'info',     dot: true  },
  blocked:      { label: 'Blocked',     badge: 'danger',   dot: true  },
  review:       { label: 'In Review',   badge: 'purple',   dot: false },
  done:         { label: 'Done',        badge: 'success',  dot: false },
}

const priorityConfig: Record<string, { label: string; badge: BadgeVariant; dot: string }> = {
  low:      { label: 'Low',      badge: 'default', dot: 'bg-slate-400'  },
  medium:   { label: 'Medium',   badge: 'warning', dot: 'bg-amber-400'  },
  high:     { label: 'High',     badge: 'warning', dot: 'bg-orange-500' },
  critical: { label: 'Critical', badge: 'danger',  dot: 'bg-red-500'    },
}

const BLOCKER_CATEGORIES = [
  'Waiting on client', 'Waiting on approval', 'Technical issue',
  'Resource shortage', 'Dependencies', 'Budget', 'Other',
]

export default function TaskDetailClient({ task: initialTask, currentUser, members }: {
  task: any
  currentUser: any
  members: any[]
}) {
  const router = useRouter()
  const [task, setTask] = useState(initialTask)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(initialTask.title)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showBlockerModal, setShowBlockerModal] = useState(false)
  const [blockerReason, setBlockerReason] = useState(initialTask.blocker_reason ?? '')
  const [blockerCategory, setBlockerCategory] = useState(initialTask.blocker_category ?? '')
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'attachments'>('comments')
  const fileRef = useRef<HTMLInputElement>(null)

  const status = statusConfig[task.status] ?? statusConfig.not_started
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  async function updateTask(updates: Record<string, any>) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) { toast.error('Failed to update task'); return }
    const { task: updated } = await res.json()
    setTask((prev: any) => ({ ...prev, ...updated }))
    toast.success('Task updated')
  }

  async function saveTitle() {
    if (!titleValue.trim() || titleValue === task.title) { setEditingTitle(false); return }
    await updateTask({ title: titleValue })
    setEditingTitle(false)
  }

  async function submitComment() {
    if (!comment.trim()) return
    setSubmittingComment(true)
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    })
    if (res.ok) {
      const { comment: newComment } = await res.json()
      setTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments ?? []), {
          ...newComment,
          author: { id: currentUser.id, full_name: currentUser.fullName, avatar_url: currentUser.avatarUrl },
        }],
      }))
      setComment('')
      toast.success('Comment added')
    } else toast.error('Failed to add comment')
    setSubmittingComment(false)
  }

  async function saveBlocker() {
    await updateTask({ status: 'blocked', blockerReason, blockerCategory })
    setTask((prev: any) => ({ ...prev, status: 'blocked', blocker_reason: blockerReason, blocker_category: blockerCategory }))
    setShowBlockerModal(false)
  }

  async function clearBlocker() {
    await updateTask({ status: 'in_progress', blockerReason: null, blockerCategory: null })
    setTask((prev: any) => ({ ...prev, status: 'in_progress', blocker_reason: null, blocker_category: null }))
  }

  async function deleteTask() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    toast.success('Task deleted')
    router.push('/tasks')
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white
        text-sm transition mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        All tasks
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            {/* Blocker banner */}
            {task.blocker_reason && (
              <motion.div {...scaleIn}
                className="flex items-start gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-400">Blocked</p>
                  {task.blocker_category && <p className="text-xs text-red-400/70 mt-0.5">{task.blocker_category}</p>}
                  <p className="text-sm text-slate-300 mt-1">{task.blocker_reason}</p>
                </div>
                <button onClick={clearBlocker} className="text-red-400/50 hover:text-red-400 transition shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Title */}
            <div className="mb-4">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={titleValue}
                    onChange={e => setTitleValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(task.title) } }}
                    className="flex-1 bg-transparent text-xl font-bold text-white border-0
                      border-b-2 border-indigo-500 focus:outline-none pb-1"
                    autoFocus
                  />
                  <button onClick={saveTitle} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingTitle(false); setTitleValue(task.title) }}
                    className="p-1.5 text-slate-400 hover:bg-white/5 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-3 group">
                  <h1 className={cn('text-xl font-bold leading-snug flex-1',
                    task.status === 'done' ? 'text-slate-500 line-through' : 'text-white')}>
                    {task.title}
                  </h1>
                  <button onClick={() => setEditingTitle(true)}
                    className="p-1.5 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100
                      hover:bg-white/5 rounded-lg transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.badge} dot={status.dot}>{status.label}</Badge>
              <Badge variant={priority.badge}>
                <span className={cn('w-1.5 h-1.5 rounded-full mr-1', priority.dot)} />
                {priority.label}
              </Badge>
              {task.category && <Badge variant="outline">{task.category}</Badge>}
              {task.tags?.map((tag: string) => (
                <Badge key={tag} variant="outline"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>
              ))}
            </div>

            {/* Progress slider */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Progress</span>
                <span className="text-sm font-semibold text-white">{task.progress}%</span>
              </div>
              <Progress value={task.progress} size="lg" animated />
              <input
                type="range" min="0" max="100" value={task.progress}
                onChange={e => setTask((p: any) => ({ ...p, progress: Number(e.target.value) }))}
                onMouseUp={() => updateTask({ progress: task.progress })}
                onTouchEnd={() => updateTask({ progress: task.progress })}
                className="w-full mt-2 accent-indigo-500 cursor-pointer"
              />
            </div>

            {task.description && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/[0.06]">
              {(['comments', 'activity', 'attachments'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('flex-1 py-3.5 text-sm font-medium capitalize transition-all',
                    activeTab === tab
                      ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]')}>
                  {tab}
                  {tab === 'comments' && task.comments?.length > 0 && (
                    <span className="ml-2 text-xs bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-full">
                      {task.comments.length}
                    </span>
                  )}
                  {tab === 'attachments' && task.attachments?.length > 0 && (
                    <span className="ml-2 text-xs bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-full">
                      {task.attachments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'comments' && (
                  <motion.div key="comments" {...fadeIn} className="space-y-4">
                    {task.comments?.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No comments yet</p>
                      </div>
                    )}
                    {task.comments?.map((c: any) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar size="sm">
                          {c.author?.avatar_url
                            ? <AvatarImage src={c.author.avatar_url} alt={c.author.full_name} />
                            : <AvatarFallback>{getInitials(c.author?.full_name ?? 'U')}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{c.author?.full_name}</span>
                            <span className="text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(currentUser.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment() }}
                          placeholder="Add a comment... (⌘+Enter to submit)"
                          rows={3}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl
                            px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600
                            resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                            hover:border-white/20 transition-all"
                        />
                        <button onClick={submitComment} disabled={!comment.trim() || submittingComment}
                          className="absolute right-3 bottom-3 p-1.5 text-indigo-400 hover:text-indigo-300
                            disabled:text-slate-600 transition hover:bg-indigo-400/10 rounded-lg">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div key="activity" {...fadeIn} className="space-y-3">
                    {task.task_activities?.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No activity yet</p>
                      </div>
                    )}
                    {task.task_activities?.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <Avatar size="xs">
                          {a.actor?.avatar_url
                            ? <AvatarImage src={a.actor.avatar_url} alt={a.actor.full_name} />
                            : <AvatarFallback>{getInitials(a.actor?.full_name ?? 'U')}</AvatarFallback>}
                        </Avatar>
                        <div>
                          <p className="text-sm text-slate-400">
                            <span className="text-white font-medium">{a.actor?.full_name}</span>
                            {' '}{a.action} this task
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{timeAgo(a.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'attachments' && (
                  <motion.div key="attachments" {...fadeIn}>
                    <div className="mb-4">
                      <input ref={fileRef} type="file" className="hidden" multiple />
                      <Button variant="outline" size="sm" icon={<Paperclip className="w-4 h-4" />}
                        onClick={() => fileRef.current?.click()}>
                        Attach files
                      </Button>
                    </div>
                    {task.attachments?.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                        <Paperclip className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No files attached</p>
                        <p className="text-xs text-slate-600 mt-1">Drag files here or click Attach files</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {task.attachments?.map((att: any) => (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]
                            hover:border-indigo-500/30 hover:bg-white/[0.03] transition group">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">{att.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {(att.file_size / 1024).toFixed(1)} KB · {timeAgo(att.created_at)}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</h3>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Status</label>
              <div className="relative">
                <select
                  value={task.status}
                  onChange={e => {
                    const val = e.target.value
                    if (val === 'blocked') { setShowBlockerModal(true) }
                    else { updateTask({ status: val }); setTask((p: any) => ({ ...p, status: val })) }
                  }}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-3 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Priority</label>
              <div className="relative">
                <select
                  value={task.priority}
                  onChange={e => { updateTask({ priority: e.target.value }); setTask((p: any) => ({ ...p, priority: e.target.value })) }}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-3 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Assigned to</label>
              <div className="relative">
                <select
                  value={task.assigned_to ?? ''}
                  onChange={e => { updateTask({ assignedTo: e.target.value }); setTask((p: any) => ({ ...p, assigned_to: e.target.value })) }}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-3 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {task.status !== 'done' ? (
              <Button variant="secondary" size="sm" className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => { updateTask({ status: 'done', progress: 100 }); setTask((p: any) => ({ ...p, status: 'done', progress: 100 })) }}>
                Mark as done
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full"
                icon={<Circle className="w-4 h-4" />}
                onClick={() => { updateTask({ status: 'in_progress', progress: 0 }); setTask((p: any) => ({ ...p, status: 'in_progress', progress: 0 })) }}>
                Reopen task
              </Button>
            )}
          </div>

          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3">
              {task.project && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Project</span>
                  <Link href={`/projects/${task.project.id}`}
                    className="flex items-center gap-1.5 text-xs text-white hover:text-indigo-400 transition">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                    {task.project.name}
                  </Link>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Due date</span>
                  <span className={cn('text-xs font-medium', isOverdue ? 'text-red-400' : 'text-white')}>
                    {formatDate(task.due_date)}{isOverdue && ' · Overdue'}
                  </span>
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Estimated</span>
                  <span className="text-xs text-white">{task.estimated_hours}h</span>
                </div>
              )}
              {task.actual_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Actual</span>
                  <span className="text-xs text-white">{task.actual_hours}h</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Created</span>
                <span className="text-xs text-slate-400">{timeAgo(task.created_at)}</span>
              </div>
              {task.creator && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">By</span>
                  <span className="text-xs text-white">{task.creator.full_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5">
            <Button variant="ghost" size="sm"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={deleteTask}>
              Delete task
            </Button>
          </div>
        </div>
      </div>

      {/* Blocker modal */}
      <AnimatePresence>
        {showBlockerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBlockerModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Mark as blocked</h3>
                  <p className="text-slate-400 text-sm">Tell your team what&apos;s blocking this</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Category</label>
                  <div className="relative">
                    <select value={blockerCategory} onChange={e => setBlockerCategory(e.target.value)}
                      className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                        px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                        focus:ring-2 focus:ring-red-500/50 hover:border-white/20 transition-all cursor-pointer">
                      <option value="">Select a category</option>
                      {BLOCKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">What&apos;s blocking this?</label>
                  <textarea value={blockerReason} onChange={e => setBlockerReason(e.target.value)}
                    placeholder="Describe what is blocking progress..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
                      text-sm text-white placeholder:text-slate-600 resize-none focus:outline-none
                      focus:ring-2 focus:ring-red-500/50 hover:border-white/20 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <Button variant="danger" size="md" className="flex-1"
                  onClick={saveBlocker} disabled={!blockerReason.trim()}>
                  Confirm blocker
                </Button>
                <Button variant="ghost" size="md" onClick={() => setShowBlockerModal(false)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}