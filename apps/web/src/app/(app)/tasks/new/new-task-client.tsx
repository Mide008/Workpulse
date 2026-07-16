// apps/web/src/app/(app)/tasks/new/new-task-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plus, X, Loader2, Sparkles,
  Calendar, Clock, AlertCircle, User, FolderKanban,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
]

const STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

interface NewTaskClientProps {
  projects: any[]
  members: any[]
  currentUserId: string
}

export default function NewTaskClient({ projects, members, currentUserId }: NewTaskClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('not_started')
  const [assignedTo, setAssignedTo] = useState(currentUserId)
  const [projectId, setProjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // ---------- Smart Assign state ----------
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<any>(null)

  // ---------- Smart Assign function ----------
  async function getSuggestion() {
    if (!title.trim()) {
      toast.error('Enter a task title first')
      return
    }
    setSuggesting(true)
    setSuggestion(null)

    try {
      const res = await fetch('/api/agents/smart-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: title.trim(),
          taskPriority: priority,
          taskDescription: description.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestion(data.suggestion)
        // Auto-apply the suggested assignee if available
        if (data.suggestion?.userId) {
          setAssignedTo(data.suggestion.userId)
        }
      } else if (res.status === 404) {
        toast.error('Smart Assign not available yet. Check back soon.')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to get suggestion')
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSuggesting(false)
    }
  }

  // ---------- Form submission ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          assignedTo: assignedTo || currentUserId,
          projectId: projectId || undefined,
          dueDate: dueDate || undefined,
          estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
          category: category || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Task created')
        router.push('/tasks')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to create task')
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Tag management ----------
  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  const inputClass = 'w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition'

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tasks">
          <button className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Create Task</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add a new task to your workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Task title <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className={inputClass}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add details about this task..."
            rows={4}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {/* Grid: Priority + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className={inputClass}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={inputClass}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid: Assignee + Project */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Assignee
              </label>
              <button
                type="button"
                onClick={getSuggestion}
                disabled={suggesting}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--primary)',
                }}
              >
                {suggesting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Smart assign
              </button>
            </div>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className={inputClass}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} {m.id === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>

            {/* Suggestion display */}
            {suggestion && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-xs mt-2"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  borderColor: 'rgba(99,102,241,0.2)',
                  border: '1px solid',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <p style={{ color: 'var(--text-secondary)' }}>{suggestion.reason}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Project
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid: Due date + Estimate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Est. hours
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value)}
              placeholder="e.g. 2.5"
              min="0"
              step="0.5"
              className={inputClass}
            />
          </div>
        </div>

        {/* Category + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Category
            </label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Development"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Tags
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Add tag"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const input = e.currentTarget
                    addTag(input.value)
                    input.value = ''
                  }
                }}
                className={cn(inputClass, 'flex-1')}
              />
              <button
                type="button"
                onClick={e => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  if (input) {
                    addTag(input.value)
                    input.value = ''
                  }
                }}
                className="px-4 rounded-xl border transition hover:bg-[var(--bg-elevated)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      color: 'var(--primary)',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
          <Link href="/tasks">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}