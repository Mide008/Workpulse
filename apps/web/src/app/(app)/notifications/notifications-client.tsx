'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, MessageSquare, Target, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { staggerItem } from '@/lib/motion'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  task_overdue:  { icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
  task_comment:  { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  task_assigned: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  goal_updated:  { icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  blocker_alert: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  mention:       { icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  default:       { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/10' },
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: any[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unread = notifications.filter(n => !n.read).length

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}
            icon={<CheckCheck className="w-4 h-4" />}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06]
            flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No notifications yet</p>
          <p className="text-slate-600 text-sm mt-1">You'll be notified of important updates here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] ?? typeConfig.default
            const Icon = cfg.icon
            return (
              <motion.div
                key={n.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div
                  onClick={() => { if (!n.read) markRead(n.id) }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all',
                    n.read
                      ? 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04]'
                      : 'bg-indigo-500/5 border border-indigo-500/20 hover:border-indigo-500/30'
                  )}
                >
                  <div className={cn('p-2.5 rounded-xl shrink-0', cfg.bg)}>
                    <Icon className={cn('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', n.read ? 'text-slate-300' : 'text-white')}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}