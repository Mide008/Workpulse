// apps/web/src/app/(app)/projects/[id]/project-board.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { Plus, X, Loader2 } from 'lucide-react'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500', dbStatus: 'not_started' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500', dbStatus: 'in_progress' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-500', dbStatus: 'blocked' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500', dbStatus: 'done' },
]

function normalizeStatus(status: string) {
  if (!status) return 'todo'
  const s = status.toLowerCase().replace(/[\s-]/g, '_')
  if (s === 'inprogress' || s === 'in_progress') return 'in_progress'
  if (s === 'blocked' || s === 'block') return 'blocked'
  if (s === 'done' || s === 'completed') return 'done'
  return 'todo'
}

export default function ProjectBoard({ initialTasks, projectId, workspaceId }: { initialTasks: any[], projectId: string, workspaceId: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (addingTo && inputRef.current) inputRef.current.focus()
  }, [addingTo])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, rawStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || normalizeStatus(task.status) === rawStatus) return

    const col = COLUMNS.find(c => c.id === rawStatus)
    const dbStatus = col?.dbStatus || 'not_started'

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: dbStatus } : t))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Task moved to ${col?.label}`)
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t))
      toast.error('Could not move task')
    }
  }

  const handleQuickAdd = async (colId: string, dbStatus: string) => {
    if (!newTaskTitle.trim()) {
      setAddingTo(null)
      return
    }
    setIsCreating(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          project_id: projectId,
          workspace_id: workspaceId,
          status: dbStatus,
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create task')

      setTasks(prev => [{ ...data.task, status: dbStatus }, ...prev])
      setNewTaskTitle('')
      setAddingTo(null)
      toast.success('Task created')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => normalizeStatus(t.status) === col.id)
        
        return (
          <div 
            key={col.id} 
            className="bg-[var(--bg-surface)] border border-white/5 rounded-2xl p-4 min-h-[400px] flex flex-col group"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="font-bold text-[var(--text-primary)] text-sm">{col.label}</h3>
              <span className="ml-auto text-xs font-bold bg-white/5 px-2 py-0.5 rounded-full text-[var(--text-secondary)]">
                {colTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {colTasks.map(task => (
                <motion.div key={task.id} layout draggable onDragStart={(e) => handleDragStart(e as any, task.id)}>
                  <Link href={`/tasks/${task.id}`} className="block bg-[var(--bg-elevated)] border border-white/10 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50 transition-colors">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{task.title}</p>
                    {task.description && <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{task.description}</p>}
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-[9px] font-bold">
                            {getInitials(task.assignee.full_name)}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium truncate max-w-[80px]">
                            {task.assignee.full_name}
                          </span>
                        </div>
                      ) : <span className="text-[10px] text-[var(--text-muted)]">Unassigned</span>}
                      
                      {task.priority && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          task.priority === 'high' || task.priority === 'critical' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-3">
              {addingTo === col.id ? (
                <div className="bg-[var(--bg-elevated)] border border-[var(--primary)]/50 p-2 rounded-xl">
                  <textarea
                    ref={inputRef}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAdd(col.id, col.dbStatus); }
                      if (e.key === 'Escape') setAddingTo(null)
                    }}
                    placeholder="Task title..."
                    className="w-full bg-transparent text-sm text-[var(--text-primary)] resize-none focus:outline-none mb-2"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleQuickAdd(col.id, col.dbStatus)} disabled={isCreating} className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                      {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add Task'}
                    </button>
                    <button onClick={() => setAddingTo(null)} className="p-1.5 text-[var(--text-muted)] hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTo(col.id)} className="w-full py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> Add task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}