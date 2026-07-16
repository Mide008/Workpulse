// apps/web/src/app/(app)/agents/agents-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Plus, X, Loader2, Check, Zap, Clock, AlertTriangle,
  Target, ToggleLeft, ToggleRight, Trash2, Play, CheckCircle2,
  XCircle, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'

const TRIGGERS = [
  { id: 'task_overdue', label: 'Task becomes overdue', icon: Clock },
  { id: 'task_blocked_48h', label: 'Task blocked for 48+ hours', icon: AlertTriangle },
  { id: 'goal_behind', label: 'Goal falls behind schedule', icon: Target },
  { id: 'kpi_drop', label: 'KPI score drops significantly', icon: Zap },
  { id: 'new_deal', label: 'New deal created', icon: Zap },
  { id: 'deal_stagnant', label: 'Deal inactive for 7+ days', icon: Clock },
]

const ACTIONS = [
  { id: 'notify_manager', label: 'Notify manager', description: 'Send in-app notification to workspace managers' },
  { id: 'notify_assignee', label: 'Notify assignee', description: 'Send notification to the task/goal owner' },
  { id: 'create_followup_task', label: 'Create follow-up task', description: 'Automatically create a related task' },
  { id: 'send_slack', label: 'Post to Slack', description: 'Send message to configured Slack channel' },
  { id: 'generate_ai_report', label: 'Generate AI report', description: 'Create an AI-written summary notification' },
]

const STATUS_ICON: Record<string, any> = {
  success: CheckCircle2,
  error: XCircle,
  running: Loader2,
}

const STATUS_COLOR: Record<string, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  running: 'text-indigo-500',
}

const BUILT_IN_AGENTS = [
  { name: 'Daily Digest', schedule: 'Every day at 7am', description: 'Morning briefing for managers with task overview', path: '/api/agents/daily-digest' },
  { name: 'Blocker Escalation', schedule: 'Every 6 hours', description: 'Alerts when tasks blocked for 48+ hours', path: '/api/agents/blocker-escalation' },
  { name: 'Goal Risk Detection', schedule: 'Every Sunday', description: 'Flags goals falling behind target trajectory', path: '/api/agents/goal-risk' },
  { name: 'Weekly Pulse', schedule: 'Every Friday 4pm', description: 'Personalised performance note for each member', path: '/api/agents/weekly-pulse' },
]

export default function AgentsClient({ rules: initial, runs, user }: {
  rules: any[]; runs: any[]; user: any
}) {
  const [rules, setRules] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [testingAgent, setTestingAgent] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', trigger: '', action: '',
    notifyRole: 'manager', message: '',
  })

  async function createRule(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.trigger || !form.action) { toast.error('Fill in all required fields'); return }
    setCreating(true)

    const res = await fetch('/api/agents/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        triggerType: form.trigger,
        actionType: form.action,
        triggerConfig: {},
        conditionConfig: {},
        actionConfig: { notifyRole: form.notifyRole, message: form.message },
      }),
    })

    if (res.ok) {
      const { rule } = await res.json()
      setRules(prev => [rule, ...prev])
      setShowCreate(false)
      setForm({ name: '', description: '', trigger: '', action: '', notifyRole: 'manager', message: '' })
      toast.success('Agent rule created')
    } else {
      toast.error('Failed to create rule')
    }
    setCreating(false)
  }

  async function toggleRule(id: string, enabled: boolean) {
    const res = await fetch(`/api/agents/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    })
    if (res.ok) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r))
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this agent rule?')) return
    const res = await fetch(`/api/agents/rules/${id}`, { method: 'DELETE' })
    if (res.ok) setRules(prev => prev.filter(r => r.id !== id))
  }

  async function testBuiltInAgent(path: string, name: string) {
    setTestingAgent(name)
    try {
      const res = await fetch(path + `?secret=${process.env.NEXT_PUBLIC_CRON_SECRET ?? 'test'}`, { method: 'GET' })
      if (res.ok) {
        toast.success(`${name} ran successfully. Check your notifications.`)
      } else {
        toast.error(`${name} failed. Check logs.`)
      }
    } catch {
      toast.error('Could not reach agent endpoint')
    }
    setTestingAgent(null)
  }

  return (
    <motion.div
      variants={staggerContainer} initial="initial" animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AI Agent Builder
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Configure automated agents that act on your workspace data
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />
          New rule
        </button>
      </motion.div>

      {/* Built-in agents */}
      <motion.div variants={staggerItem}
        className="rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Bot className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Built-in agents
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Active</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {BUILT_IN_AGENTS.map(agent => (
            <div key={agent.name} className="group p-4 rounded-xl border transition-all hover:shadow-sm"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{agent.description}</p>
                  <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{agent.schedule}</p>
                </div>
                <button
                  onClick={() => testBuiltInAgent(agent.path, agent.name)}
                  disabled={testingAgent === agent.name}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border opacity-0 group-hover:opacity-100 transition"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--primary)' }}
                >
                  {testingAgent === agent.name
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Play className="w-3 h-3" />
                  }
                  Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Custom rules */}
      <motion.div variants={staggerItem}
        className="rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Custom rules ({rules.length})
        </h2>

        {rules.length === 0 ? (
          <EmptyState
            icon={<Bot className="w-7 h-7" />}
            title="No custom rules yet"
            description="Create rules that trigger automatically based on workspace events. Combine triggers, conditions, and actions to build powerful workflows."
            action={{ label: 'Create first rule', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="space-y-2">
            {rules.map(rule => {
              const trigger = TRIGGERS.find(t => t.id === rule.trigger_type)
              const action = ACTIONS.find(a => a.id === rule.action_type)
              return (
                <div key={rule.id} className="group flex items-center gap-4 p-4 rounded-xl border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold" style={{ color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {rule.name}
                      </p>
                      {!rule.enabled && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trigger && <span className="flex items-center gap-1"><trigger.icon className="w-3 h-3" />{trigger.label}</span>}
                      {action && <><ChevronRight className="w-3 h-3" /><span>{action.label}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => toggleRule(rule.id, rule.enabled)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition"
                      style={{ color: rule.enabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Recent runs */}
      {runs.length > 0 && (
        <motion.div variants={staggerItem}
          className="rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Recent runs</h2>
          <div className="space-y-2">
            {runs.slice(0, 10).map(run => {
              const Icon = STATUS_ICON[run.status] ?? CheckCircle2
              return (
                <div key={run.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <Icon className={cn('w-4 h-4 shrink-0', STATUS_COLOR[run.status], run.status === 'running' && 'animate-spin')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {run.agent_type.replace(/_/g, ' ')}
                    </p>
                    {run.result && (
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {JSON.stringify(run.result).slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(run.ran_at), { addSuffix: true })}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Create rule modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New agent rule</h3>
                  <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={createRule} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rule name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Escalate overdue critical tasks"
                      autoFocus
                      className="w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Trigger *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIGGERS.map(t => (
                        <button type="button" key={t.id}
                          onClick={() => setForm(p => ({ ...p, trigger: t.id }))}
                          className="flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-all"
                          style={{
                            background: form.trigger === t.id ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                            borderColor: form.trigger === t.id ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                            color: 'var(--text-secondary)',
                          }}>
                          <t.icon className="w-3.5 h-3.5 shrink-0" style={{ color: form.trigger === t.id ? 'var(--primary)' : undefined }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Action *</label>
                    <div className="space-y-1.5">
                      {ACTIONS.map(a => (
                        <button type="button" key={a.id}
                          onClick={() => setForm(p => ({ ...p, action: a.id }))}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                          style={{
                            background: form.action === a.id ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                            borderColor: form.action === a.id ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                          }}>
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                            form.action === a.id ? 'border-indigo-500 bg-indigo-500' : 'border-[var(--border)]'
                          )}>
                            {form.action === a.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.label}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="flex-1 h-10 rounded-xl border text-sm font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={creating}
                      className="flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}>
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? 'Creating...' : 'Create rule'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}