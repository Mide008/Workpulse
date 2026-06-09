'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Circle, Mail } from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

const statusConfig: Record<string, { label: string; color: string; badge: BadgeVariant }> = {
  not_started: { label: 'Not Started', color: 'text-[var(--text-secondary)]', badge: 'default' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', badge: 'info' },
  blocked:     { label: 'Blocked', color: 'text-red-400', badge: 'danger' },
  review:      { label: 'In Review', color: 'text-purple-400', badge: 'purple' },
  done:        { label: 'Done', color: 'text-emerald-400', badge: 'success' },
}

export default function TeamMemberClient({ member, tasks, latestKpi, currentUser }: {
  member: any; tasks: any[]; latestKpi: any; currentUser: any
}) {
  const role = member.role as any
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const overdue = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <Link href="/team"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]
          text-sm transition mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Team
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="space-y-4">
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-6 text-center">
            <Avatar size="xl" className="mx-auto mb-4">
              {member.avatar_url
                ? <AvatarImage src={member.avatar_url} alt={member.full_name} />
                : <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
              }
            </Avatar>
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{member.full_name}</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-3">{member.job_title ?? 'Team member'}</p>
            {role && <Badge variant="default">{role.name}</Badge>}
            {member.email && (
              <a href={`mailto:${member.email}`}
                className="flex items-center justify-center gap-2 mt-4 text-sm
                  text-[var(--text-secondary)] hover:text-indigo-400 transition">
                <Mail className="w-4 h-4" />
                {member.email}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Performance</h3>
            {[
              { label: 'Total tasks', value: total },
              { label: 'Completed', value: done },
              { label: 'Blocked', value: blocked },
              { label: 'Overdue', value: overdue },
            ].map(s => (
              <div key={s.label} className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{s.label}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{s.value}</span>
              </div>
            ))}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-[var(--text-secondary)]">Completion rate</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{completionRate}%</span>
              </div>
              <Progress value={completionRate} size="sm"
                color={completionRate >= 80 ? 'emerald' : completionRate >= 50 ? 'indigo' : 'amber'} />
            </div>
          </div>

          {/* KPI */}
          {latestKpi && (
            <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">KPI Score</h3>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-indigo-400">{latestKpi.overall_score}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Overall score</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Completion', value: latestKpi.completion_rate },
                  { label: 'On-time', value: latestKpi.on_time_rate },
                  { label: 'Priority', value: latestKpi.priority_score },
                  { label: 'Activity', value: latestKpi.activity_score },
                ].map(k => (
                  <div key={k.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[var(--text-muted)]">{k.label}</span>
                      <span className="text-xs text-slate-300">{k.value}%</span>
                    </div>
                    <Progress value={k.value} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-surface)]/80 border border-[var(--border)][0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)][0.06]">
              <h2 className="font-semibold text-[var(--text-primary)]">Tasks ({total})</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[var(--text-muted)] text-sm">No tasks assigned</p>
                </div>
              ) : tasks.map(task => {
                const st = statusConfig[task.status] ?? statusConfig.not_started
                const isOverdue = task.due_date &&
                  new Date(task.due_date) < new Date() && task.status !== 'done'

                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 px-6 py-4 hover:bg-white/[0.03]
                      transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate transition-colors',
                          task.status === 'done'
                            ? 'text-[var(--text-muted)] line-through'
                            : 'text-slate-200 group-hover:text-[var(--text-primary)]'
                        )}>
                          {task.title}
                        </p>
                        {task.project && (
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: task.project.color }} />
                            {task.project.name}
                          </span>
                        )}
                      </div>
                      <Badge variant={st.badge} className="shrink-0">{st.label}</Badge>
                      {task.due_date && (
                        <span className={cn(
                          'text-xs shrink-0',
                          isOverdue ? 'text-red-400' : 'text-slate-600'
                        )}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}