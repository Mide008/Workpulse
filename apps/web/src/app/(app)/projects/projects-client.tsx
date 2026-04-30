'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Plus, Search, FolderKanban, Users,
  Calendar, CheckCircle2, Clock, Pause,
  Archive, ChevronRight,
} from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { staggerItem } from '@/lib/motion'

const statusConfig: Record<string, { label: string; badge: BadgeVariant; icon: any }> = {
  active:    { label: 'Active', badge: 'success', icon: Clock },
  paused:    { label: 'Paused', badge: 'warning', icon: Pause },
  completed: { label: 'Completed', badge: 'info', icon: CheckCircle2 },
  archived:  { label: 'Archived', badge: 'default', icon: Archive },
}

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500',
  medium: 'bg-amber-400', low: 'bg-slate-400',
}

export default function ProjectsClient({
  initialProjects, currentUser,
}: {
  initialProjects: any[]
  currentUser: any
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = useMemo(() => {
    return initialProjects.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || p.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [initialProjects, search, filterStatus])

  const stats = useMemo(() => ({
    total: initialProjects.length,
    active: initialProjects.filter(p => p.status === 'active').length,
    completed: initialProjects.filter(p => p.status === 'completed').length,
  }), [initialProjects])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {stats.active} active · {stats.completed} completed
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl
              pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              hover:border-white/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06]
          rounded-xl p-1">
          {['all', 'active', 'paused', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filterStatus === s
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06]
            flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No projects found</p>
          <p className="text-slate-600 text-sm mt-1">Create your first project to get started</p>
          <Link href="/projects/new">
            <Button variant="secondary" size="sm" className="mt-4"
              icon={<Plus className="w-3.5 h-3.5" />}>
              New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              variants={staggerItem}
              initial="initial"
              animate="animate"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  const status = statusConfig[project.status] ?? statusConfig.active
  const StatusIcon = status.icon
  const totalTasks = project.tasks?.length ?? 0
  const doneTasks = project.tasks?.filter((t: any) => t.status === 'done').length ?? 0
  const isOverdue = project.end_date && new Date(project.end_date) < new Date()
    && project.status !== 'completed'

  const members = (project.project_members ?? [])
    .map((pm: any) => pm.user)
    .filter(Boolean)

  return (
    <Link href={`/projects/${project.id}`}>
      <div className={cn(
        'group h-full p-5 rounded-2xl border cursor-pointer',
        'bg-slate-900/80 border-white/[0.06]',
        'hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5',
        'hover:-translate-y-0.5 transition-all duration-300',
      )}>
        {/* Color bar + header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-indigo-300
                transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn('w-1.5 h-1.5 rounded-full', priorityDot[project.priority])} />
                <span className="text-xs text-slate-500 capitalize">{project.priority}</span>
              </div>
            </div>
          </div>
          <Badge variant={status.badge} className="shrink-0">
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">{doneTasks}/{totalTasks} tasks</span>
            <span className="text-xs font-semibold text-white">{project.progress}%</span>
          </div>
          <Progress
            value={project.progress}
            size="sm"
            color={project.status === 'completed' ? 'emerald' : 'indigo'}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <AvatarGroup
            avatars={members.map((m: any) => ({
              name: m.full_name,
              avatarUrl: m.avatar_url,
              color: project.color,
            }))}
            max={4}
            size="xs"
          />
          <div className="flex items-center gap-3">
            {project.end_date && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                isOverdue ? 'text-red-400' : 'text-slate-500'
              )}>
                <Calendar className="w-3 h-3" />
                {formatDate(project.end_date)}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400
              group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}