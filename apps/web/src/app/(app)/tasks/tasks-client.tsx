'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Plus, Search, LayoutGrid, List,
  Clock, AlertTriangle, CheckCircle2, Circle,
  ChevronDown, SlidersHorizontal, X,
} from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { staggerItem } from '@/lib/motion'

// ---------- dnd‑kit imports ----------
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ViewMode = 'list' | 'board'
type SortKey = 'created_at' | 'due_date' | 'priority' | 'status'

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<string, number> = { blocked: 0, in_progress: 1, review: 2, not_started: 3, done: 4 }

const priorityConfig: Record<string, { label: string; dot: string; badge: 'default' | 'warning' | 'danger' }> = {
  critical: { label: 'Critical', dot: 'bg-red-500', badge: 'danger' },
  high:     { label: 'High',     dot: 'bg-orange-500', badge: 'warning' },
  medium:   { label: 'Medium',   dot: 'bg-amber-400',  badge: 'warning' },
  low:      { label: 'Low',      dot: 'bg-slate-400',  badge: 'default' },
}

const statusConfig: Record<string, { label: string; color: string; icon: any; badge: 'default' | 'info' | 'danger' | 'purple' | 'success' }> = {
  not_started: { label: 'Not Started', color: 'text-slate-400',   icon: Circle,        badge: 'default' },
  in_progress:  { label: 'In Progress', color: 'text-blue-400',   icon: Clock,         badge: 'info'    },
  blocked:      { label: 'Blocked',     color: 'text-red-400',    icon: AlertTriangle, badge: 'danger'  },
  review:       { label: 'In Review',   color: 'text-purple-400', icon: Clock,         badge: 'purple'  },
  done:         { label: 'Done',        color: 'text-emerald-400',icon: CheckCircle2,  badge: 'success' },
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  progress: number
  due_date: string | null
  estimated_hours: number | null
  category: string | null
  tags: string[]
  blocker_reason: string | null
  created_at: string
  project_id: string | null
  assigned_to: string | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  project: { id: string; name: string; color: string } | null
}

// ---------- Draggable card used in board view ----------
function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/tasks/${task.id}`}>
        <div className={cn(
          'p-4 rounded-xl cursor-pointer group mb-2',
          'bg-slate-900/80 border border-white/[0.06]',
          'hover:border-indigo-500/30 hover:shadow-lg transition-all duration-200',
          task.status === 'blocked' && 'border-red-500/20',
          isDragging && 'shadow-2xl shadow-black/50'
        )}>
          <p className={cn('text-sm font-medium leading-snug mb-2',
            task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200')}>
            {task.title}
          </p>
          {task.blocker_reason && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-red-400 bg-red-500/10 px-2 py-1.5 rounded-lg">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{task.blocker_reason}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className={cn('w-2 h-2 rounded-full', priorityConfig[task.priority]?.dot ?? 'bg-slate-400')} />
            {task.due_date && (
              <span className={cn('text-xs',
                new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-slate-600')}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

// ---------- Main component ----------
export default function TasksClient({ initialTasks, projects, members, currentUser }: {
  initialTasks: Task[]
  projects: any[]
  members: any[]
  currentUser: any
}) {
  // Local state so we can optimistically update on drag
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('created_at')
  const [showFilters, setShowFilters] = useState(false)

  // ---------- dnd‑kit sensors ----------
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const newStatus = over.id as string
    if (!['not_started', 'in_progress', 'review', 'blocked', 'done'].includes(newStatus)) return

    const task = tasks.find(t => t.id === active.id)
    if (!task || task.status === newStatus) return

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t))

    // Persist to server
    await fetch(`/api/tasks/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  // ---------- Filtering & sorting ----------
  const filtered = useMemo(() => {
    let result = tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || t.status === filterStatus
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority
      return matchSearch && matchStatus && matchPriority
    })
    result.sort((a, b) => {
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return result
  }, [tasks, search, filterStatus, filterPriority, sortBy])

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }), [tasks])

  const activeFilters = [filterStatus !== 'all', filterPriority !== 'all'].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {stats.done}/{stats.total} complete
            {stats.blocked > 0 && <span className="text-red-400 ml-2">· {stats.blocked} blocked</span>}
            {stats.overdue > 0 && <span className="text-amber-400 ml-2">· {stats.overdue} overdue</span>}
          </p>
        </div>
        <Link href="/tasks/new">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>New Task</Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5
              text-sm text-white placeholder:text-slate-500 focus:outline-none
              focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
              hover:border-white/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="md"
          onClick={() => setShowFilters(!showFilters)}
          icon={<SlidersHorizontal className="w-4 h-4" />}
        >
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs
              flex items-center justify-center font-bold">{activeFilters}</span>
          )}
        </Button>

        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="appearance-none bg-white/[0.04] border border-white/10 rounded-xl
              pl-3 pr-8 py-2.5 text-sm text-slate-300 focus:outline-none
              focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all cursor-pointer"
          >
            <option value="created_at">Newest first</option>
            <option value="due_date">Due date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView('list')}
                className={cn('p-2 rounded-lg transition-all',
                  view === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5')}
              ><List className="w-4 h-4" /></button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView('board')}
                className={cn('p-2 rounded-lg transition-all',
                  view === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5')}
              ><LayoutGrid className="w-4 h-4" /></button>
            </TooltipTrigger>
            <TooltipContent>Board view</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 flex-wrap p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Status</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', ...Object.keys(statusConfig)].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10')}>
                      {s === 'all' ? 'All' : statusConfig[s]?.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Priority</label>
                <div className="flex items-center gap-1.5">
                  {['all', ...Object.keys(priorityConfig)].map(p => (
                    <button key={p} onClick={() => setFilterPriority(p)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        filterPriority === p ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10')}>
                      {p === 'all' ? 'All' : priorityConfig[p]?.label}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { setFilterStatus('all'); setFilterPriority('all') }}
                  className="ml-auto text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskListView tasks={filtered} />
          </motion.div>
        ) : (
          <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskBoardView tasks={filtered} sensors={sensors} onDragEnd={handleDragEnd} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- List view (unchanged) ----------
function TaskListView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06]
          flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">No tasks found</p>
        <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or create a new task</p>
        <Link href="/tasks/new">
          <Button variant="secondary" size="sm" className="mt-4" icon={<Plus className="w-3.5 h-3.5" />}>
            New Task
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task, i) => (
        <motion.div key={task.id} variants={staggerItem} initial="initial" animate="animate"
          style={{ animationDelay: `${i * 40}ms` }}>
          <Link href={`/tasks/${task.id}`}><TaskListRow task={task} /></Link>
        </motion.div>
      ))}
    </div>
  )
}

function TaskListRow({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const StatusIcon = status?.icon ?? Circle
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div className={cn(
      'group flex items-center gap-4 px-4 py-3.5 rounded-xl',
      'bg-white/[0.02] border border-transparent',
      'hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200 cursor-pointer',
      task.status === 'blocked' && 'border-red-500/10 bg-red-500/[0.02]'
    )}>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110', priority?.dot ?? 'bg-slate-400')} />
        </TooltipTrigger>
        <TooltipContent>{priority?.label ?? task.priority} priority</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <StatusIcon className={cn('w-4 h-4 shrink-0', status?.color ?? 'text-slate-400')} />
        </TooltipTrigger>
        <TooltipContent>{status?.label ?? task.status}</TooltipContent>
      </Tooltip>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate transition-colors',
          task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
              {task.project.name}
            </span>
          )}
          {task.blocker_reason && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />Blocked
            </span>
          )}
        </div>
      </div>

      {task.progress > 0 && task.status !== 'done' && (
        <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
          <div className="flex-1 bg-slate-800 rounded-full h-1">
            <div className="h-1 rounded-full bg-indigo-500 transition-all" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-xs text-slate-500 w-7 text-right">{task.progress}%</span>
        </div>
      )}

      {task.due_date && (
        <Tooltip>
          <TooltipTrigger>
            <span className={cn('hidden md:block text-xs shrink-0 px-2 py-1 rounded-lg',
              isOverdue ? 'text-red-400 bg-red-500/10' : 'text-slate-500 bg-white/[0.04]')}>
              {formatDate(task.due_date)}
            </span>
          </TooltipTrigger>
          <TooltipContent>{isOverdue ? 'Overdue' : 'Due date'}</TooltipContent>
        </Tooltip>
      )}

      {task.assignee && (
        <Tooltip>
          <TooltipTrigger>
            <Avatar size="xs">
              {task.assignee.avatar_url
                ? <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name} />
                : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>}
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{task.assignee.full_name}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// ---------- Board view with drag-and-drop ----------
function TaskBoardView({ tasks, sensors, onDragEnd }: {
  tasks: Task[]
  sensors: any
  onDragEnd: (event: DragEndEvent) => void
}) {
  const columns = Object.entries(statusConfig).map(([key, val]) => ({ key, ...val }))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          const ColIcon = col.icon
          return (
            <div key={col.key} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3 px-1">
                <ColIcon className={cn('w-4 h-4', col.color)} />
                <span className="text-sm font-medium text-slate-300">{col.label}</span>
                <span className="ml-auto text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {colTasks.map((task, i) => (
                    <DraggableTaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-24 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                      <p className="text-xs text-slate-600">No tasks</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}