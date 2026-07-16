// apps/web/src/app/(app)/audit/audit-client.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, Search, Filter, Shield } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const ACTION_LABELS: Record<string, string> = {
  task_created: 'Created task', task_updated: 'Updated task', task_deleted: 'Deleted task',
  task_status_changed: 'Changed task status', task_completed: 'Completed task',
  task_assigned: 'Assigned task', task_commented: 'Commented on task',
  blocker_added: 'Flagged blocker', blocker_resolved: 'Resolved blocker',
  project_created: 'Created project', project_updated: 'Updated project', project_completed: 'Completed project',
  goal_created: 'Created goal', goal_updated: 'Updated goal', goal_checkin: 'Checked in on goal', goal_completed: 'Achieved goal',
  member_invited: 'Invited member', member_joined: 'Member joined',
  deal_created: 'Created deal', deal_stage_changed: 'Moved deal', deal_won: 'Won deal', deal_lost: 'Lost deal',
  contact_created: 'Created contact',
}

export default function AuditClient({ logs, workspaceId }: { logs: any[]; workspaceId: string }) {
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  const entities = Array.from(new Set(logs.map(l => l.entity_type).filter(Boolean)))

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter
      const matchSearch = !search ||
        log.entity_title?.toLowerCase().includes(search.toLowerCase()) ||
        (log.user as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        ACTION_LABELS[log.action]?.toLowerCase().includes(search.toLowerCase())
      return matchEntity && matchSearch
    })
  }, [logs, search, entityFilter])

  async function exportCSV() {
    setExporting(true)
    const rows = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity', 'Details'].join(','),
      ...filtered.map(log => [
        new Date(log.created_at).toISOString(),
        `"${(log.user as any)?.full_name ?? 'System'}"`,
        ACTION_LABELS[log.action] ?? log.action,
        log.entity_type ?? '',
        `"${log.entity_title ?? ''}"`,
        `"${JSON.stringify(log.metadata ?? {}).replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workpulse-audit-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported')
    setExporting(false)
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={staggerItem} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            Audit Trail
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Complete record of all workspace activity. {logs.length} events logged.
          </p>
        </div>
        <button onClick={exportCSV} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, or entity..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          {['all', ...entities].map(e => (
            <button key={e} onClick={() => setEntityFilter(e)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={entityFilter === e
                ? { background: 'var(--primary)', color: 'white' }
                : { color: 'var(--text-secondary)' }
              }>
              {e}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}
        className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
          {filtered.slice(0, 100).map((log, i) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors">
              <Avatar size="sm" className="shrink-0 mt-0.5">
                {(log.user as any)?.avatar_url
                  ? <AvatarImage src={(log.user as any).avatar_url} alt={(log.user as any).full_name} />
                  : <AvatarFallback>{getInitials((log.user as any)?.full_name ?? 'System')}</AvatarFallback>
                }
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(log.user as any)?.full_name ?? 'WorkPulse Agent'}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {log.entity_title && (
                    <span className="text-sm font-medium truncate max-w-48" style={{ color: 'var(--text-primary)' }}>
                      &ldquo;{log.entity_title}&rdquo;
                    </span>
                  )}
                </div>
                {log.metadata?.newStatus && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    → {String(log.metadata.newStatus).replace(/_/g, ' ')}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs capitalize px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {log.entity_type ?? 'system'}
                </span>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity matching your filters</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}