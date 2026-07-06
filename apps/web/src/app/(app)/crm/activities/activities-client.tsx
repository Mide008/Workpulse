// apps/web/src/app/(app)/crm/activities/activities-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Mail, Users, FileText, Video, Plus, X, Loader2,
  Calendar, CheckCircle2, Clock,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { getInitials } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const ACTIVITY_TYPES = [
  { id: 'call', label: 'Call', icon: Phone, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'meeting', label: 'Meeting', icon: Users, color: 'text-violet-500 bg-violet-500/10' },
  { id: 'note', label: 'Note', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'demo', label: 'Demo', icon: Video, color: 'text-emerald-500 bg-emerald-500/10' },
]

export default function ActivitiesClient({ activities: initial, contacts, deals, user }: {
  activities: any[]; contacts: any[]; deals: any[]; user: any
}) {
  const [activities, setActivities] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({
    type: 'call', subject: '', description: '', outcome: '',
    contactId: '', dealId: '', completedAt: new Date().toISOString().split('T')[0],
  })

  const filtered = activities.filter(a => typeFilter === 'all' || a.type === typeFilter)

  async function createActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type) { toast.error('Select an activity type'); return }
    setCreating(true)

    const res = await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        subject: form.subject || null,
        description: form.description || null,
        outcome: form.outcome || null,
        contactId: form.contactId || null,
        dealId: form.dealId || null,
        completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : null,
      }),
    })

    if (res.ok) {
      const { activity } = await res.json()
      setActivities(prev => [activity, ...prev])
      setShowCreate(false)
      setForm({ type: 'call', subject: '', description: '', outcome: '', contactId: '', dealId: '', completedAt: new Date().toISOString().split('T')[0] })
      toast.success('Activity logged')
    } else {
      toast.error('Failed to log activity')
    }
    setCreating(false)
  }

  const inputClass = 'w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Activities</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Log calls, emails, meetings, and notes</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />
          Log activity
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'var(--bg-elevated)' }}>
        {['all', ...ACTIVITY_TYPES.map(t => t.id)].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={typeFilter === t
              ? { background: 'var(--primary)', color: 'white' }
              : { color: 'var(--text-secondary)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-7 h-7" />}
          title="No activities yet"
          description="Log calls, emails, meetings, demos, and notes against your contacts and deals. Activities build a timeline of every customer interaction."
          action={{ label: 'Log first activity', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {filtered.map(activity => {
            const typeConfig = ACTIVITY_TYPES.find(t => t.id === activity.type) ?? ACTIVITY_TYPES[3]
            const TypeIcon = typeConfig.icon

            return (
              <motion.div key={activity.id} variants={staggerItem}>
                <div className="flex items-start gap-4 p-4 rounded-2xl border"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div className={`p-2.5 rounded-xl shrink-0 ${typeConfig.color}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold capitalize"
                          style={{ color: 'var(--text-muted)' }}>{typeConfig.label}</span>
                        {activity.subject && (
                          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{activity.subject}</p>
                        )}
                      </div>
                      <p className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {activity.completed_at
                          ? formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true })
                          : formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                        }
                      </p>
                    </div>
                    {activity.description && (
                      <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {activity.description}
                      </p>
                    )}
                    {activity.outcome && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{activity.outcome}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      {activity.user && (
                        <div className="flex items-center gap-1.5">
                          <Avatar size="xs">
                            {activity.user.avatar_url
                              ? <AvatarImage src={activity.user.avatar_url} alt={activity.user.full_name} />
                              : <AvatarFallback>{getInitials(activity.user.full_name)}</AvatarFallback>
                            }
                          </Avatar>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activity.user.full_name}</span>
                        </div>
                      )}
                      {activity.contact && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {activity.contact.full_name}
                        </span>
                      )}
                      {activity.deal && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {activity.deal.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Create modal */}
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
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Log activity</h3>
                  <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={createActivity} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {ACTIVITY_TYPES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, type: t.id }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${t.color}`}
                          style={form.type === t.id
                            ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }
                            : { borderColor: 'var(--border)', background: 'var(--bg-elevated)' }
                          }
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                    <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Discovery call with Sarah Johnson" autoFocus
                      className={inputClass} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contact</label>
                      <select value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        <option value="">No contact</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deal</label>
                      <select value={form.dealId} onChange={e => setForm(p => ({ ...p, dealId: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        <option value="">No deal</option>
                        {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={3} placeholder="What was discussed..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Outcome</label>
                    <input value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
                      placeholder="Agreed to send proposal by Friday"
                      className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                    <input value={form.completedAt} onChange={e => setForm(p => ({ ...p, completedAt: e.target.value }))}
                      type="date" className={inputClass} style={inputStyle} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="flex-1 h-10 rounded-xl border text-sm font-medium transition"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={creating}
                      className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}>
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? 'Logging...' : 'Log activity'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}