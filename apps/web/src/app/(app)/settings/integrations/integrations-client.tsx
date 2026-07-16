// apps/web/src/app/(app)/settings/integrations/integrations-client.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hash, Webhook, Bot, Check, X, Loader2, Copy, RefreshCw, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function IntegrationsClient({ integrations, workspaceId }: {
  integrations: any[]; workspaceId: string
}) {
  const slack = integrations.find(i => i.type === 'slack')
  const webhook = integrations.find(i => i.type === 'webhook_inbound')

  const [slackUrl, setSlackUrl] = useState(slack?.config?.webhook_url ?? '')
  const [slackEvents, setSlackEvents] = useState<string[]>(
    slack?.config?.events ?? ['task_completed', 'blocker_added', 'deal_won', 'goal_completed']
  )
  const [savingSlack, setSavingSlack] = useState(false)
  const [removingSlack, setRemovingSlack] = useState(false)
  const [slackConnected, setSlackConnected] = useState(slack?.enabled ?? false)
  const [webhookKey, setWebhookKey] = useState(webhook?.config?.api_key ?? '')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const SLACK_EVENTS = [
    { id: 'task_completed', label: 'Task completed' },
    { id: 'task_created', label: 'Task created' },
    { id: 'blocker_added', label: 'Blocker flagged' },
    { id: 'blocker_resolved', label: 'Blocker resolved' },
    { id: 'deal_won', label: 'Deal won' },
    { id: 'deal_created', label: 'New deal added' },
    { id: 'goal_completed', label: 'Goal achieved' },
    { id: 'member_joined', label: 'Member joined' },
  ]

  function toggleEvent(id: string) {
    setSlackEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  async function saveSlack() {
    if (!slackUrl.startsWith('https://hooks.slack.com/')) {
      toast.error('Paste a valid Slack incoming webhook URL')
      return
    }
    setSavingSlack(true)
    const res = await fetch('/api/integrations/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: slackUrl, events: slackEvents }),
    })
    if (res.ok) {
      setSlackConnected(true)
      toast.success('Slack connected. Test message sent to your channel.')
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to connect Slack')
    }
    setSavingSlack(false)
  }

  async function removeSlack() {
    setRemovingSlack(true)
    await fetch('/api/integrations/slack', { method: 'DELETE' })
    setSlackConnected(false)
    setSlackUrl('')
    toast.success('Slack disconnected')
    setRemovingSlack(false)
  }

  async function generateWebhookKey() {
    setGeneratingKey(true)
    const key = `wp_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`

    const res = await fetch('/api/integrations/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    })

    if (res.ok) {
      setWebhookKey(key)
      await navigator.clipboard.writeText(key).catch(() => {})
      toast.success('API key generated and copied to clipboard')
    } else {
      toast.error('Failed to generate key')
    }
    setGeneratingKey(false)
  }

  async function copyKey() {
    await navigator.clipboard.writeText(webhookKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    toast.success('Copied')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Integrations</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Connect WorkPulse to your existing tools
        </p>
      </motion.div>

      {/* Slack */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg bg-[#4A154B]/10">
            <Hash className="w-5 h-5" style={{ color: '#4A154B' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Slack</h2>
              {slackConnected && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Connected</span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Send WorkPulse events to a Slack channel. Uses incoming webhooks — no OAuth required.
            </p>
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Get webhook URL from Slack <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {slackConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Connected to Slack. Notifications will be sent to your configured channel.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Active events:</p>
              <div className="flex flex-wrap gap-1.5">
                {slackEvents.map(e => (
                  <span key={e} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {SLACK_EVENTS.find(ev => ev.id === e)?.label ?? e}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={removeSlack} disabled={removingSlack}
              className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-600 transition">
              {removingSlack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              Disconnect Slack
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Slack webhook URL
              </label>
              <input
                value={slackUrl}
                onChange={e => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                className="w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Events to send to Slack:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SLACK_EVENTS.map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggleEvent(ev.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left transition-all',
                      slackEvents.includes(ev.id) ? 'border-indigo-500/30' : ''
                    )}
                    style={{
                      background: slackEvents.includes(ev.id) ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                      borderColor: slackEvents.includes(ev.id) ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                      slackEvents.includes(ev.id) ? 'border-indigo-500 bg-indigo-500' : 'border-[var(--border)]'
                    )}>
                      {slackEvents.includes(ev.id) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveSlack} disabled={savingSlack || !slackUrl}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>
              {savingSlack && <Loader2 className="w-4 h-4 animate-spin" />}
              {savingSlack ? 'Connecting...' : 'Connect Slack'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Inbound Webhook */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--primary)' }}>
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Inbound Webhook</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Connect Zapier, Make, or any automation tool to create tasks, contacts, and deals in WorkPulse.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Webhook endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs p-2.5 rounded-xl truncate"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {appUrl}/api/webhooks/inbound
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${appUrl}/api/webhooks/inbound`); toast.success('Copied') }}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                style={{ color: 'var(--text-muted)' }}>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>API key (send as x-api-key header)</p>
            {webhookKey ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs p-2.5 rounded-xl truncate"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {webhookKey}
                </code>
                <button onClick={copyKey}
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                  style={{ color: copiedKey ? '#10B981' : 'var(--text-muted)' }}>
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={generateWebhookKey} disabled={generatingKey}
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                  style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw className={cn('w-4 h-4', generatingKey && 'animate-spin')} />
                </button>
              </div>
            ) : (
              <button onClick={generateWebhookKey} disabled={generatingKey}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
                {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
                Generate API key
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Supported events:</p>
            <div className="space-y-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <p>POST /api/webhooks/inbound</p>
              <p className="pl-2">{'{ "event": "create_task", "data": { "title": "...", "priority": "high" } }'}</p>
              <p className="pl-2">{'{ "event": "create_contact", "data": { "full_name": "...", "email": "..." } }'}</p>
              <p className="pl-2">{'{ "event": "create_deal", "data": { "title": "...", "value": 5000 } }'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Agents status */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Agents</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Automated agents running in the background on your workspace.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            { name: 'Daily Digest', description: 'Morning briefing for managers every day at 7am', schedule: 'Daily 7:00am' },
            { name: 'Blocker Escalation', description: 'Alerts managers when tasks have been blocked for 48+ hours', schedule: 'Every 6 hours' },
            { name: 'Goal Risk Detection', description: 'Flags goals that are falling behind their target trajectory', schedule: 'Weekly Sunday 8am' },
            { name: 'Weekly Pulse', description: 'Personalised Friday performance note for every team member', schedule: 'Friday 4:00pm' },
          ].map(agent => (
            <div key={agent.name} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                {agent.schedule}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}