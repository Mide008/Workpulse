'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { EmptyState } from '@/components/ui/empty-state'

const typeIcon: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  task: Zap,
  default: Bell,
}

const typeColor: Record<string, string> = {
  info: 'text-blue-500 bg-blue-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  task: 'text-indigo-500 bg-indigo-500/10',
  default: 'text-slate-500 bg-slate-500/10',
}

export default function NotificationsClient({
  notifications: initial,
  userId,
}: {
  notifications: any[]
  userId: string
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)

  const unread = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch(`/api/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    toast.success('All notifications marked as read')
  }

  async function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
              border transition-all hover:opacity-80"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-7 h-7" />}
          title="All caught up"
          description="Notifications appear here when tasks are assigned to you, blockers are flagged, goals are updated, or team members comment on your work."
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
          {notifications.map(notif => {
            const Icon = typeIcon[notif.type] ?? typeIcon.default
            const colors = typeColor[notif.type] ?? typeColor.default
            return (
              <motion.div key={notif.id} variants={staggerItem}>
                <div
                  className={cn(
                    'group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer',
                    !notif.read && 'ring-1 ring-indigo-500/20'
                  )}
                  style={{
                    background: notif.read ? 'var(--bg-surface)' : 'rgba(99,102,241,0.04)',
                    borderColor: notif.read ? 'var(--border)' : 'rgba(99,102,241,0.15)',
                  }}
                  onClick={() => !notif.read && markRead(notif.id)}
                >
                  <div className={cn('p-2 rounded-xl shrink-0 mt-0.5', colors)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug"
                        style={{ color: 'var(--text-primary)' }}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notif.message && (
                      <p className="text-sm mt-0.5 leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}>
                        {notif.message}
                      </p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {!notif.read && (
                      <button onClick={e => { e.stopPropagation(); markRead(notif.id) }}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                        title="Mark read">
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteNotification(notif.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}