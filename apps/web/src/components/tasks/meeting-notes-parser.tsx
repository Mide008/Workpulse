// apps/web/src/components/tasks/meeting-notes-parser.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Loader2, Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExtractedTask {
  title: string
  priority: string
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
  context: string
}

interface Props {
  onCreateTasks: (tasks: ExtractedTask[]) => Promise<void>
  onClose: () => void
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-500', high: 'text-orange-500', medium: 'text-amber-500', low: 'text-slate-400',
}

export default function MeetingNotesParser({ onCreateTasks, onClose }: Props) {
  const [notes, setNotes] = useState('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<{ tasks: ExtractedTask[]; summary: string } | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)

  async function handleParse(e: React.FormEvent) {
    e.preventDefault()
    if (!notes.trim()) return
    setParsing(true)
    setResult(null)

    const res = await fetch('/api/ai/parse-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })

    if (res.ok) {
      const { parsed } = await res.json()
      setResult(parsed)
      setSelected(new Set(parsed.tasks.map((_: any, i: number) => i)))
    } else {
      toast.error('Could not parse meeting notes. Try again.')
    }
    setParsing(false)
  }

  async function handleCreate() {
    if (!result) return
    setCreating(true)
    const toCreate = result.tasks.filter((_, i) => selected.has(i))
    await onCreateTasks(toCreate)
    toast.success(`${toCreate.length} task${toCreate.length !== 1 ? 's' : ''} created`)
    onClose()
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Extract tasks from meeting notes
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {!result ? (
            <form onSubmit={handleParse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Paste your meeting notes or transcript
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={10}
                  autoFocus
                  placeholder="e.g. Q3 planning meeting notes...&#10;&#10;John will complete the API documentation by end of Friday.&#10;Sarah needs to follow up with the client about the proposal.&#10;We agreed that James will set up the staging environment next week..."
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <button type="submit" disabled={parsing || !notes.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {parsing ? 'Extracting action items...' : 'Extract action items'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {result.summary && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Meeting summary</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {result.tasks.length} action item{result.tasks.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => setSelected(selected.size === result.tasks.length ? new Set() : new Set(result.tasks.map((_, i) => i)))}
                    className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    {selected.size === result.tasks.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div className="space-y-2">
                  {result.tasks.map((task, i) => (
                    <div
                      key={i}
                      onClick={() => setSelected(prev => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                        selected.has(i) ? 'border-indigo-500/30' : 'opacity-60'
                      )}
                      style={{
                        background: selected.has(i) ? 'rgba(99,102,241,0.06)' : 'var(--bg-elevated)',
                        borderColor: selected.has(i) ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                      }}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                        selected.has(i) ? 'border-indigo-500 bg-indigo-500' : 'border-[var(--border)]'
                      )}>
                        {selected.has(i) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                        {task.context && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.context}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={cn('text-xs font-medium capitalize', PRIORITY_COLOR[task.priority])}>
                            {task.priority}
                          </span>
                          {task.assigneeName && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→ {task.assigneeName}</span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setResult(null)}
                  className="px-4 py-2.5 rounded-xl text-sm border font-medium transition"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Try again
                </button>
                <button onClick={handleCreate} disabled={selected.size === 0 || creating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? 'Creating...' : `Create ${selected.size} task${selected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}