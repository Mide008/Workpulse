// apps/web/src/components/tasks/template-picker.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutTemplate, X, ArrowRight } from 'lucide-react'
import { TASK_TEMPLATES, type TaskTemplate } from '@/lib/task-templates'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', ...Array.from(new Set(TASK_TEMPLATES.map(t => t.category)))]

interface TemplatePickerProps {
  onSelect: (template: TaskTemplate) => void
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? TASK_TEMPLATES
    : TASK_TEMPLATES.filter(t => t.category === activeCategory)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition hover:opacity-80"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <LayoutTemplate className="w-4 h-4" />
        Use template
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Task templates</h3>
                  </div>
                  <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1.5 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'var(--border)' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={activeCategory === cat
                        ? { background: 'var(--primary)', color: 'white' }
                        : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 p-4 max-h-96 overflow-y-auto">
                  {filtered.map(template => (
                    <button
                      key={template.id}
                      onClick={() => { onSelect(template); setOpen(false) }}
                      className="group text-left p-4 rounded-xl border transition-all hover:border-[var(--border-strong)] hover:-translate-y-0.5"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</p>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition shrink-0"
                          style={{ color: 'var(--primary)' }} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{template.description}</p>
                      <p className="text-[10px] mt-2 font-medium uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                        {template.category}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}