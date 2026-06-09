'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Calendar, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn, getInitials } from '@/lib/utils'
import { fadeInUp } from '@/lib/motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  color: z.string().default('#6366F1'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamId: z.string().optional(),
})

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
]

const PRIORITIES = [
  { value: 'low', label: 'Low', dot: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', dot: 'bg-red-500' },
]

export default function NewProjectClient({ members, teams, currentUserId }: {
  members: any[]
  teams: any[]
  currentUserId: string
}) {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState('#6366F1')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUserId])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', color: '#6366F1' },
  })

  const priority = watch('priority')

  function toggleMember(id: string) {
    if (id === currentUserId) return
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: any) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        color: selectedColor,
        memberIds: selectedMembers,
        teamId: data.teamId || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error('Failed to create project: ' + (err.error ?? res.statusText))
      return
    }
    const { project } = await res.json()
    toast.success('Project created')
    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/projects"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]
          text-sm transition mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to projects
      </Link>

      <motion.div {...fadeInUp}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create new project</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Organise tasks and collaborate as a team</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <input
              {...register('name')}
              placeholder="Project name"
              autoFocus
              className={cn(
                'w-full bg-transparent text-2xl font-semibold text-[var(--text-primary)]',
                'placeholder:text-slate-600 border-0 border-b-2 border-[var(--border)]10',
                'focus:outline-none focus:border-indigo-500 pb-3 transition-colors',
                errors.name && 'border-red-500'
              )}
            />
            {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name.message as string}</p>}
          </div>

          {/* Description */}
          <textarea
            {...register('description')}
            placeholder="What is this project about?"
            rows={3}
            className="w-full bg-white/[0.03] border border-[var(--border)]10 rounded-xl px-4 py-3
              text-sm text-[var(--text-primary)] placeholder:text-slate-600 resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              hover:border-[var(--border)]20 transition-all"
          />

          {/* Color */}
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-3">Project colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setSelectedColor(c); setValue('color', c) }}
                  className="relative w-9 h-9 rounded-xl transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && (
                    <Check className="w-4 h-4 text-[var(--text-primary)] absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-3">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue('priority', p.value as any)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    priority === p.value
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-[var(--text-primary)]'
                      : 'border-[var(--border)]10 bg-white/[0.02] text-[var(--text-secondary)] hover:border-[var(--border)]20'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', p.dot)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates + Team */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                <Calendar className="w-4 h-4" />Start date
              </label>
              <input {...register('startDate')} type="date"
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl
                  px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all
                  [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                <Calendar className="w-4 h-4" />End date
              </label>
              <input {...register('endDate')} type="date"
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl
                  px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all
                  [color-scheme:dark]"
              />
            </div>
            {teams.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                  <Users className="w-4 h-4" />Team
                </label>
                <div className="relative">
                  <select {...register('teamId')}
                    className="w-full appearance-none bg-white/[0.04] border border-[var(--border)]10
                      rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--text-primary)] focus:outline-none
                      focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all cursor-pointer"
                  >
                    <option value="">No team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Members */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-3">
              <Users className="w-4 h-4" />
              Team members ({selectedMembers.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {members.map(m => {
                const isSelected = selectedMembers.includes(m.id)
                const isCreator = m.id === currentUserId
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-[var(--border)][0.06] bg-white/[0.02] hover:border-[var(--border)]20',
                      isCreator && 'opacity-75 cursor-default'
                    )}
                  >
                    <Avatar size="xs">
                      {m.avatar_url
                        ? <AvatarImage src={m.avatar_url} alt={m.full_name} />
                        : <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>
                      }
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{m.full_name}</p>
                      {isCreator && <p className="text-[10px] text-[var(--primary)]">Owner</p>}
                    </div>
                    {isSelected && !isCreator && (
                      <Check className="w-3 h-3 text-[var(--primary)] ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)][0.06]">
            <Button type="submit" variant="primary" loading={isSubmitting}
              className="flex-1 sm:flex-none sm:px-8">
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
            <Link href="/projects">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}