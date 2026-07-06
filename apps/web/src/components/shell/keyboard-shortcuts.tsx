// apps/web/src/components/shell/keyboard-shortcuts.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Global search' },
  { keys: ['N'], label: 'New task', path: '/tasks/new' },
  { keys: ['P'], label: 'New project', path: '/projects/new' },
  { keys: ['G', 'D'], label: 'Go to Dashboard', path: '/dashboard' },
  { keys: ['G', 'T'], label: 'Go to Tasks', path: '/tasks' },
  { keys: ['G', 'P'], label: 'Go to Projects', path: '/projects' },
  { keys: ['G', 'A'], label: 'Go to Analytics', path: '/analytics' },
  { keys: ['G', 'C'], label: 'Go to Chat', path: '/chat' },
  { keys: ['?'], label: 'Show shortcuts' },
  { keys: ['Esc'], label: 'Close / Cancel' },
]

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const [sequence, setSequence] = useState<string[]>([])
  const [sequenceTimer, setSequenceTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip if typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      // Skip if modifier keys used (except ? which needs shift)
      if ((e.metaKey || e.ctrlKey || e.altKey) && e.key !== 'k') return

      const key = e.key.toUpperCase()

      if (e.key === '?') { setShowHelp(h => !h); return }
      if (e.key === 'Escape') { setShowHelp(false); return }

      // Single key shortcuts
      if (key === 'N') { e.preventDefault(); router.push('/tasks/new'); return }
      if (key === 'P') { e.preventDefault(); router.push('/projects/new'); return }

      // Sequence shortcuts (G + something)
      if (key === 'G') {
        setSequence(['G'])
        if (sequenceTimer) clearTimeout(sequenceTimer)
        const t = setTimeout(() => setSequence([]), 1000)
        setSequenceTimer(t)
        return
      }

      if (sequence[0] === 'G') {
        if (sequenceTimer) clearTimeout(sequenceTimer)
        setSequence([])
        const paths: Record<string, string> = {
          D: '/dashboard', T: '/tasks', P: '/projects',
          A: '/analytics', C: '/chat', S: '/settings/workspace',
        }
        if (paths[key]) { e.preventDefault(); router.push(paths[key]) }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router, sequence, sequenceTimer])

  return (
    <>
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2.5">
                    <Keyboard className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Keyboard shortcuts</h3>
                  </div>
                  <button onClick={() => setShowHelp(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-1.5 max-h-96 overflow-y-auto">
                  {SHORTCUTS.map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map(k => (
                          <kbd key={k}
                            className="text-xs font-mono px-2 py-0.5 rounded-lg border"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Press <kbd className="font-mono px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: 'var(--border)' }}>?</kbd> anytime to open this
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}