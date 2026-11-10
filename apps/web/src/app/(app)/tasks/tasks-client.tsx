// apps/web/src/app/(app)/tasks/tasks-client.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Plus, Search, LayoutGrid, List,
  Clock, AlertTriangle, CheckCircle2, Circle,
  ChevronDown, SlidersHorizontal, X,
  Sparkles, FileText,
} from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { staggerContainer, staggerItem, spring } from '@/lib/motion'
import { ToggleButton } from '@/components/ui/toggle-button'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import NLPTaskInput from '@/components/tasks/nlp-task-input'
import MeetingNotesParser from '@/components/tasks/meeting-notes-parser'

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
type DateFilter = 'all' | 'today' | 'week' | 'month'

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<string, number> = { blocked: 0, in_progress: 1, review: 2, not_started: 3, done: 4 }

const priorityConfig: Record<string, { label: string; dot: string; badge: 'default' | 'warning' | 'danger' }> = {
  critical: { label: 'Critical', dot: 'bg-red-500', badge: 'danger' },
  high:     { label: 'High',     dot: 'bg-orange-500', badge: 'warning' },
  medium:   { label: 'Medium',   dot: 'bg-amber-400',  badge: 'warning' },
  low:      { label: 'Low',      dot: 'bg-slate-400',  badge: 'default' },
}

const statusConfig: Record<string, { label: string; color: string; icon: any; badge: 'default' | 'info' | 'danger' | 'purple' | 'success' }> = {
  not_started: { label: 'Not Started', color: 'text-[var(--text-secondary)]', icon: Circle,        badge: 'default' },
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

function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/tasks/${task.id}`}>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          transition={spring.snappy}
          className={cn(
            'p-4 rounded-xl cursor-pointer group mb-2 bg-[var(--bg-surface)] border border-[var(--border)]',
            'hover:border-[var(--primary)]/50 hover:shadow-lg transition-all duration-200',
            task.status === 'blocked' && 'border-red-500/30',
            isDragging && 'shadow-2xl shadow-black/50 rotate-2 scale-105'
          )}
        >
          <p className={cn('text-sm font-bold leading-snug mb-3',
            task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]')}>
            {task.title}
          </p>
          {task.blocker_reason && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{task.blocker_reason}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className={cn('w-2.5 h-2.5 rounded-full', priorityConfig[task.priority]?.dot ?? 'bg-slate-400')} />
            {task.due_date && (
              <span className={cn('text-[11px] font-medium px-2 py-1 rounded-md bg-[var(--bg-elevated)]',
                new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-[var(--text-muted)]')}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </motion.div>
      </Link>
    </div>
  )
}

export default function TasksClient({ initialTasks, projects, members, currentUser }: {
  initialTasks: Task[]; projects: any[]; members: any[]; currentUser: any
}) {
  const router = useRouter()
  useEffect(() => { router.refresh() }, [])

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('created_at')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showNLP, setShowNLP] = useState(false)
  const [showMeetingParser, setShowMeetingParser] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selected.size === filteredTasks.length) setSelected(new Set())
    else setSelected(new Set(filteredTasks.map((t: any) => t.id)))
  }

  async function bulkUpdateStatus(status: string) {
    setBulkLoading(true)
    await Promise.allSettled(Array.from(selected).map(id => fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })))
    setTasks(prev => prev.map((t: any) => selected.has(t.id) ? { ...t, status } : t))
    setSelected(new Set())
    toast.success(`${selected.size} task${selected.size > 1 ? 's' : ''} updated`)
    setBulkLoading(false)
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} task${selected.size > 1 ? 's' : ''}?`)) return
    setBulkLoading(true)
    await Promise.allSettled(Array.from(selected).map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
    setTasks(prev => prev.filter((t: any) => !selected.has(t.id)))
    setSelected(new Set())
    toast.success('Tasks deleted')
    setBulkLoading(false)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const newStatus = over.id as string
    if (!['not_started', 'in_progress', 'review', 'blocked', 'done'].includes(newStatus)) return

    const task = tasks.find(t => t.id === active.id)
    if (!task || task.status === newStatus) return

    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t))
    await fetch(`/api/tasks/${active.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
  }

  async function createFromNLP(parsed: any) {
    if (!parsed.title) { toast.error('Task title is required'); return }
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: parsed.title, description: parsed.description || '', priority: parsed.priority || 'medium', dueDate: parsed.dueDate || null, assignedTo: parsed.assigneeId || currentUser?.id || null }) })
      if (res.ok) {
        const { task } = await res.json()
        setTasks(prev => [task, ...prev])
        setShowNLP(false)
        toast.success('Task created')
      } else { toast.error('Failed to create task') }
    } catch { toast.error('Network error') }
  }

  async function createFromMeeting(parsedTasks: any[]) {
    if (!parsedTasks || parsedTasks.length === 0) { toast.error('No tasks to create'); return }
    try {
      const results = await Promise.allSettled(parsedTasks.map(task => fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: task.title, priority: task.priority || 'medium', dueDate: task.dueDate || null, assignedTo: task.assigneeId || currentUser?.id || null, description: task.context || task.description || '' }) }).then(r => r.json())))
      const created = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value.task).filter(Boolean)
      if (created.length > 0) { setTasks(prev => [...created, ...prev]); toast.success(`${created.length} tasks created`) }
      setShowMeetingParser(false)
    } catch { toast.error('Network error') }
  }

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || t.status === filterStatus
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority
      let matchDate = true
      if (dateFilter !== 'all') {
        if (!t.due_date) matchDate = false
        else {
          const due = new Date(t.due_date); const now = new Date(); now.setHours(0,0,0,0)
          if (dateFilter === 'today') matchDate = due.toDateString() === now.toDateString()
          else if (dateFilter === 'week') { const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7); matchDate = due >= now && due <= weekEnd }
          else if (dateFilter === 'month') matchDate = due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
        }
      }
      return matchSearch && matchStatus && matchPriority && matchDate
    })

    result.sort((a, b) => {
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      if (sortBy === 'due_date') { if (!a.due_date) return 1; if (!b.due_date) return -1; return new Date(a.due_date).getTime() - new Date(b.due_date).getTime() }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return result
  }, [tasks, search, filterStatus, filterPriority, sortBy, dateFilter])

  const stats = useMemo(() => ({ total: tasks.length, done: tasks.filter(t => t.status === 'done').length, blocked: tasks.filter(t => t.status === 'blocked').length, overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length }), [tasks])
  const activeFilters = [filterStatus !== 'all', filterPriority !== 'all', dateFilter !== 'all'].filter(Boolean).length

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-7xl mx-auto space-y-6 pb-24">
      <motion.div variants={staggerItem} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Tasks</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">
            {stats.done}/{stats.total} complete
            {stats.blocked > 0 && <span className="text-red-500 ml-2 font-bold">· {stats.blocked} blocked</span>}
            {stats.overdue > 0 && <span className="text-amber-500 ml-2 font-bold">· {stats.overdue} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNLP(!showNLP)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-[var(--bg-elevated)]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--primary)' }}><Sparkles className="w-4 h-4" /> AI create</button>
          <button onClick={() => setShowMeetingParser(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-[var(--bg-elevated)]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><FileText className="w-4 h-4" /> From meeting</button>
          <Link href="/tasks/new"><Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>New Task</Button></Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNLP && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4"><NLPTaskInput onConfirm={createFromNLP} onClose={() => setShowNLP(false)} /></motion.div>}
        {showMeetingParser && <MeetingNotesParser onCreateTasks={createFromMeeting} onClose={() => setShowMeetingParser(false)} />}
      </AnimatePresence>

      <motion.div variants={staggerItem} className="flex items-center gap-3 flex-wrap p-3 rounded-2xl glass">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-transparent rounded-xl pl-11 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" />
        </div>
        <Button variant={showFilters ? 'secondary' : 'ghost'} size="md" onClick={() => setShowFilters(!showFilters)} icon={<SlidersHorizontal className="w-4 h-4" />}>Filters {activeFilters > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">{activeFilters}</span>}</Button>
        
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="appearance-none bg-[var(--bg-elevated)] rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium focus:outline-none cursor-pointer text-[var(--text-primary)]">
            <option value="created_at">Newest first</option><option value="due_date">Due date</option><option value="priority">Priority</option><option value="status">Status</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-[var(--text-muted)]" />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button key={f} onClick={() => setDateFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all" style={dateFilter === f ? { background: 'var(--bg-surface)', color: 'var(--primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--text-secondary)' }}>{f === 'all' ? 'All dates' : f}</button>
          ))}
        </div>

        <div className="flex items-center bg-[var(--bg-elevated)] rounded-xl p-1">
          <button onClick={() => setView('list')} className={cn('p-2 rounded-lg transition-all', view === 'list' ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}><List className="w-4 h-4" /></button>
          <button onClick={() => setView('board')} className={cn('p-2 rounded-lg transition-all', view === 'board' ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-6 flex-wrap p-5 rounded-2xl bg-[var(--bg-surface)] border" style={{ borderColor: 'var(--border)' }}>
              <div><label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-3">Status</label><div className="flex items-center gap-2 flex-wrap">{['all', ...Object.keys(statusConfig)].map(s => <ToggleButton key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)}>{s === 'all' ? 'All' : statusConfig[s]?.label}</ToggleButton>)}</div></div>
              <div className="w-px h-10 bg-[var(--border)]" />
              <div><label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-3">Priority</label><div className="flex items-center gap-2">{['all', ...Object.keys(priorityConfig)].map(p => <ToggleButton key={p} active={filterPriority === p} onClick={() => setFilterPriority(p)}>{p === 'all' ? 'All' : priorityConfig[p]?.label}</ToggleButton>)}</div></div>
              {activeFilters > 0 && <button onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setDateFilter('all') }} className="ml-auto text-xs font-bold text-[var(--text-muted)] hover:text-red-500 transition flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl glass shadow-2xl">
            <span className="text-sm font-bold px-2 text-[var(--text-primary)]">{selected.size} selected</span>
            <div className="w-px h-6 bg-[var(--border)]" />
            {[{ label: 'Done', status: 'done', color: 'text-emerald-500' }, { label: 'In Progress', status: 'in_progress', color: 'text-blue-500' }, { label: 'Blocked', status: 'blocked', color: 'text-red-500' }].map(opt => (
              <button key={opt.status} onClick={() => bulkUpdateStatus(opt.status)} disabled={bulkLoading} className={`text-xs font-bold px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] transition hover:bg-[var(--bg-elevated)] ${opt.color}`}>{opt.label}</button>
            ))}
            <button onClick={bulkDelete} disabled={bulkLoading} className="text-xs font-bold px-3 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50">Delete</button>
            <button onClick={() => setSelected(new Set())} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskListView tasks={filteredTasks} selected={selected} toggleSelect={toggleSelect} selectAll={selectAll} />
          </motion.div>
        ) : (
          <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskBoardView tasks={filteredTasks} sensors={sensors} onDragEnd={handleDragEnd} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TaskListView({ tasks, selected, toggleSelect, selectAll }: { tasks: Task[], selected: Set<string>, toggleSelect: (id: string) => void, selectAll: () => void }) {
  if (tasks.length === 0) return <EmptyState icon={<CheckCircle2 className="w-7 h-7" />} title="No tasks yet" description="Create your first task to start tracking work." action={{ label: 'Create task', href: '/tasks/new' }} />
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-1.5">
      <div className="flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border)' }}>
        <input type="checkbox" checked={selected.size === tasks.length && tasks.length > 0} onChange={selectAll} className="w-4 h-4 rounded border cursor-pointer shrink-0 mr-4 accent-[var(--primary)]" />
        <span className="flex-1">Title</span><span className="w-24 text-right">Progress</span><span className="w-24 text-right">Due date</span><span className="w-20 text-right">Assignee</span>
      </div>
      {tasks.map((task, i) => (
        <motion.div key={task.id} variants={staggerItem}>
          <Link href={`/tasks/${task.id}`}>
            <TaskListRow task={task} selected={selected.has(task.id)} toggleSelect={() => toggleSelect(task.id)} />
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

function TaskListRow({ task, selected, toggleSelect }: { task: Task, selected: boolean, toggleSelect: () => void }) {
  const priority = priorityConfig[task.priority]; const status = statusConfig[task.status]; const StatusIcon = status?.icon ?? Circle
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  return (
    <motion.div 
      whileHover={{ scale: 1.005, y: -1 }}
      transition={spring.snappy}
      className={cn('group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all border border-transparent bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border)] cursor-pointer mb-1.5', task.status === 'blocked' && 'border-red-500/20 bg-red-500/5')}
    >
      <input type="checkbox" checked={selected} onChange={toggleSelect} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border cursor-pointer shrink-0 mr-2 accent-[var(--primary)]" />
      <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', priority?.dot ?? 'bg-slate-400')} />
      <StatusIcon className={cn('w-4 h-4 shrink-0', status?.color ?? 'text-[var(--text-secondary)]')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold truncate transition-colors', task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)] group-hover:text-[var(--primary)]')}>{task.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {task.project && <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />{task.project.name}</span>}
          {task.blocker_reason && <span className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md"><AlertTriangle className="w-3 h-3" />Blocked</span>}
        </div>
      </div>
      {task.progress > 0 && task.status !== 'done' && (
        <div className="hidden sm:flex items-center gap-2 w-24 shrink-0"><div className="flex-1 bg-[var(--bg-elevated)] rounded-full h-1.5"><div className="h-1.5 rounded-full bg-[var(--primary)]" style={{ width: `${task.progress}%` }} /></div><span className="text-xs font-bold text-[var(--text-secondary)] w-7 text-right">{task.progress}%</span></div>
      )}
      {task.due_date && (
        <span className={cn('hidden md:block text-xs font-bold shrink-0 px-2.5 py-1 rounded-lg', isOverdue ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-muted)] bg-[var(--bg-elevated)]')}>{formatDate(task.due_date)}</span>
      )}
      {task.assignee && <Avatar size="xs">{task.assignee.avatar_url ? <AvatarImage src={task.assignee.avatar_url} /> : <AvatarFallback>{getInitials(task.assignee.full_name)}</AvatarFallback>}</Avatar>}
    </motion.div>
  )
}

function TaskBoardView({ tasks, sensors, onDragEnd }: { tasks: Task[], sensors: any, onDragEnd: (event: DragEndEvent) => void }) {
  const columns = Object.entries(statusConfig).map(([key, val]) => ({ key, ...val }))
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key); const ColIcon = col.icon
          return (
            <div key={col.key} className="flex-shrink-0 w-80">
              <div className="flex items-center gap-2 mb-4 px-2">
                <ColIcon className={cn('w-4 h-4', col.color)} /><span className="text-sm font-bold text-[var(--text-primary)]">{col.label}</span>
                <span className="ml-auto text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[200px] p-2 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]/50">
                  {colTasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)}
                  {colTasks.length === 0 && <div className="h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center"><p className="text-xs font-medium text-[var(--text-muted)]">No tasks</p></div>}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}