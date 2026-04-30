'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Tag, User, FolderKanban, AlignLeft, Clock, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fadeInUp } from '@/lib/motion'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'review', 'done']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PRIORITIES = [
  { value: 'low',      label: 'Low',      dot: 'bg-slate-400' },
  { value: 'medium',   label: 'Medium',   dot: 'bg-amber-400' },
  { value: 'high',     label: 'High',     dot: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', dot: 'bg-red-500' },
]

const STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'In Review' },
  { value: 'blocked',     label: 'Blocked' },
]

const CATEGORIES = [
  'Development', 'Design', 'Marketing', 'Sales', 'Operations',
  'Finance', 'Legal', 'HR', 'Research', 'Other',
]

export default function NewTaskClient({ projects, members, currentUserId }: {
  projects: any[]
  members: any[]
  currentUserId: string
}) {
  const router = useRouter()
  const [selectedPriority, setSelectedPriority] = useState('medium')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', status: 'not_started', assignedTo: currentUserId },
  })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        projectId: data.projectId || undefined,
        assignedTo: data.assignedTo || undefined,
        category: data.category || undefined,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    })

    if (!res.ok) { toast.error('Failed to create task'); return }
    const { task } = await res.json()
    toast.success('Task created')
    router.push(`/tasks/${task.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white
        text-sm transition mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to tasks
      </Link>

      <motion.div {...fadeInUp}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Create new task</h1>
          <p className="text-slate-400 text-sm mt-1">Add details to help your team understand the work</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <input
              {...register('title')}
              placeholder="What needs to be done?"
              autoFocus
              className={cn(
                'w-full bg-transparent text-2xl font-semibold text-white',
                'placeholder:text-slate-600 border-0 border-b-2 border-white/10',
                'focus:outline-none focus:border-indigo-500 pb-3 transition-colors',
                errors.title && 'border-red-500'
              )}
            />
            {errors.title && <p className="text-red-400 text-sm mt-2">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-500">Description</span>
            </div>
            <textarea
              {...register('description')}
              placeholder="Add more context, acceptance criteria, or notes..."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3
                text-sm text-white placeholder:text-slate-600 resize-none
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-red-500" />
              <span className="text-sm text-slate-500">Priority</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => { setSelectedPriority(p.value); setValue('priority', p.value as any) }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    selectedPriority === p.value
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white'
                  )}>
                  <div className={cn('w-2 h-2 rounded-full', p.dot)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Clock className="w-4 h-4" />Status
              </label>
              <div className="relative">
                <select {...register('status')}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Calendar className="w-4 h-4" />Due date
              </label>
              <input {...register('dueDate')} type="date"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  hover:border-white/20 transition-all [color-scheme:dark]" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Clock className="w-4 h-4" />Est. hours
              </label>
              <input {...register('estimatedHours')} type="number" min="0.5" step="0.5" placeholder="e.g. 4"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <FolderKanban className="w-4 h-4" />Project
              </label>
              <div className="relative">
                <select {...register('projectId')}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <User className="w-4 h-4" />Assigned to
              </label>
              <div className="relative">
                <select {...register('assignedTo')}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Tag className="w-4 h-4" />Category
              </label>
              <div className="relative">
                <select {...register('category')}
                  className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                    px-4 py-2.5 pr-8 text-sm text-white focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer">
                  <option value="">No category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Tag className="w-4 h-4" />Tags
              </label>
              <input {...register('tags')} placeholder="design, urgent, client (comma separated)"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="submit" variant="primary" size="md" loading={isSubmitting}
              className="flex-1 sm:flex-none sm:px-8">
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
            <Link href="/tasks">
              <Button type="button" variant="ghost" size="md">Cancel</Button>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}