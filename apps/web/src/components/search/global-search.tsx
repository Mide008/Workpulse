// apps/web/src/components/search/global-search.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckSquare, FolderKanban, Target, X,
  ArrowRight, Loader2, Users, ClipboardCheck, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'task' | 'project' | 'goal' | 'member' | 'approval' | 'worklog'
  title: string
  subtitle?: string
  href: string
  color?: string
}

const TYPE_CONFIG: Record<string, any> = {
  task: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Task' },
  project: { icon: FolderKanban, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Project' },
  goal: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Goal' },
  member: { icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Member' },
  approval: { icon: ClipboardCheck, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Approval' },
  worklog: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Work Log' },
}

export default function GlobalSearch({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setResults([]) }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
      setSelectedIndex(0)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 200)
    return () => clearTimeout(t)
  }, [query, search])

  function navigate(result: SearchResult) {
    router.push(result.href)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIndex]) navigate(results[selectedIndex])
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl border text-sm transition-all hover:border-[var(--border-strong)]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <Search className="w-3.5 h-3.5" /><span>Search</span>
        <span className="ml-1 text-xs px-1.5 py-0.5 rounded border font-mono" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>⌘K</span>
      </button>
      <button onClick={() => setOpen(true)} className="sm:hidden p-2.5 rounded-xl transition hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-secondary)' }}><Search className="w-4 h-4" /></button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.96, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: 'var(--primary)' }} /> : <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                  <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Search tasks, projects, people..." className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
                  {query && <button onClick={() => setQuery('')} className="shrink-0" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>}
                  <button onClick={() => setOpen(false)} className="shrink-0 text-xs px-2 py-1 rounded-lg border font-mono" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Esc</button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {!query && <div className="p-6 text-center"><Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start typing to search...</p></div>}
                  {query && !loading && results.length === 0 && <div className="p-6 text-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results found for &ldquo;{query}&rdquo;</p></div>}
                  {results.length > 0 && (
                    <div className="p-2">
                      {results.map((result, i) => {
                        const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.task
                        const Icon = config.icon
                        return (
                          <button key={result.id} onClick={() => navigate(result)} onMouseEnter={() => setSelectedIndex(i)} className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all', selectedIndex === i ? 'bg-[var(--bg-elevated)]' : 'hover:bg-[var(--bg-elevated)]')}>
                            {result.type === 'project' && result.color ? <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${result.color}20` }}><Icon className="w-4 h-4" style={{ color: result.color }} /></div> : <div className={cn('w-8 h-8 rounded-lg shrink-0 flex items-center justify-center', config.bg)}><Icon className={cn('w-4 h-4', config.color)} /></div>}
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{result.title}</p>{result.subtitle && <p className="text-xs capitalize truncate" style={{ color: 'var(--text-muted)' }}>{config.label} · {result.subtitle.replace(/_/g, ' ')}</p>}</div>
                            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><span><kbd className="font-mono">↑↓</kbd> navigate</span><span><kbd className="font-mono">↵</kbd> open</span><span><kbd className="font-mono">Esc</kbd> close</span></div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}