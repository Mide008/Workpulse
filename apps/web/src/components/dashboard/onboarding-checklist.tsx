// apps/web/src/components/dashboard/onboarding-checklist.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronDown, X, Plus, FolderKanban, Target, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Step {
  id: string
  label: string
  description: string
  href: string
  cta: string
  icon: any
  done: boolean
}

export default function OnboardingChecklist({
  workspaceId,
  steps: initialSteps,
}: {
  workspaceId: string
  steps: Record<string, boolean>
}) {
  const [steps, setSteps] = useState(initialSteps)
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  const STEPS: Step[] = [
    {
      id: 'created_task',
      label: 'Create your first task',
      description: 'Start tracking work immediately. Add any task your team is working on right now.',
      href: '/tasks/new',
      cta: 'Create task',
      icon: Plus,
      done: steps.created_task,
    },
    {
      id: 'created_project',
      label: 'Create a project',
      description: 'Group related tasks into projects to track progress at a higher level.',
      href: '/projects/new',
      cta: 'New project',
      icon: FolderKanban,
      done: steps.created_project,
    },
    {
      id: 'set_goal',
      label: 'Set a team goal',
      description: 'Define what success looks like. Goals connect daily work to outcomes.',
      href: '/goals',
      cta: 'Set a goal',
      icon: Target,
      done: steps.set_goal,
    },
    {
      id: 'invited_member',
      label: 'Invite a team member',
      description: 'WorkPulse is built for teams. Invite at least one colleague to unlock collaboration.',
      href: '/settings/workspace',
      cta: 'Invite team',
      icon: Users,
      done: steps.invited_member,
    },
    {
      id: 'generated_report',
      label: 'Generate your first report',
      description: 'See the KPI scoring engine in action. Run a performance report from Analytics.',
      href: '/analytics',
      cta: 'View analytics',
      icon: BarChart3,
      done: steps.generated_report,
    },
  ]

  const completed = STEPS.filter(s => s.done).length
  const total = STEPS.length
  const allDone = completed === total

  async function dismiss() {
    setDismissed(true)
    // Cast supabase to any to avoid type errors
    await (supabase as any)
      .from('workspaces')
      .update({ onboarding_completed: true })
      .eq('id', workspaceId)
  }

  if (dismissed || allDone) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border overflow-hidden mb-6"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        style={{ borderBottom: expanded ? `1px solid var(--border)` : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div
                key={s.id}
                className={cn('w-2 h-2 rounded-full transition-all', s.done ? 'scale-100' : 'scale-75 opacity-40')}
                style={{ background: s.done ? 'var(--primary)' : 'var(--text-muted)' }}
              />
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Get started with WorkPulse
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {completed} of {total} steps complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(completed / total) * 100}%`, background: 'var(--primary)' }}
            />
          </div>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
            style={{ color: 'var(--text-muted)' }}
          />
          <button
            onClick={e => { e.stopPropagation(); dismiss() }}
            className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] transition"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={cn(
                    'relative p-4 rounded-xl border h-full flex flex-col transition-all',
                    step.done ? 'opacity-60' : 'hover:border-[var(--border-strong)]'
                  )}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: step.done ? 'var(--border)' : 'var(--border)',
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg" style={{ background: step.done ? 'var(--bg-surface)' : 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                        <step.icon className="w-4 h-4" style={{ color: step.done ? 'var(--text-muted)' : 'var(--primary)' }} />
                      </div>
                      {step.done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <Circle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      }
                    </div>
                    <p className="text-xs font-semibold mb-1 leading-snug" style={{ color: step.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {step.label}
                    </p>
                    <p className="text-[11px] leading-relaxed mb-3 flex-1" style={{ color: 'var(--text-muted)' }}>
                      {step.description}
                    </p>
                    {!step.done && (
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white transition hover:opacity-90"
                        style={{ background: 'var(--primary)' }}
                      >
                        {step.cta}
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}