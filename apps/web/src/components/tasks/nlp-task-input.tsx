// apps/web/src/components/tasks/nlp-task-input.tsx
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ParsedTask {
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
}

interface Props {
  onConfirm: (task: ParsedTask) => void
  onClose: () => void
}

export default function NLPTaskInput({ onConfirm, onClose }: Props) {
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedTask | null>(null)

  async function handleParse(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setParsing(true)
    setParsed(null)

    const res = await fetch('/api/ai/parse-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    if (res.ok) {
      const { parsed: p } = await res.json()
      setParsed(p)
    } else {
      toast.error('Could not parse. Try again or create the task manually.')
    }
    setParsing(false)
  }

  const PRIORITY_COLOR: Record<string, string> = {
    critical: 'text-red-500 bg-red-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-slate-400 bg-slate-400/10',
  }

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Create task from natural language
          </p>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleParse} className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Ask Sarah to submit the monthly report by next Friday, high priority"
          autoFocus
          className="flex-1 h-10 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={parsing || !input.trim()}
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--primary)' }}>
          {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4 space-y-3"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              AI extracted this task — confirm to create:
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Title</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{parsed.title}</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Priority</p>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-0.5 inline-block', PRIORITY_COLOR[parsed.priority])}>
                    {parsed.priority}
                  </span>
                </div>
                {parsed.dueDate && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Due</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {new Date(parsed.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {parsed.assigneeName && (
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Assigned to</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{parsed.assigneeName}</p>
                  </div>
                )}
              </div>
              {parsed.description && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Description</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{parsed.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => onConfirm(parsed)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
                <Check className="w-3.5 h-3.5" />
                Create task
              </button>
              <button onClick={() => setParsed(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}