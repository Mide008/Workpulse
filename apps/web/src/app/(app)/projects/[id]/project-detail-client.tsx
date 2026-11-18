// apps/web/src/app/(app)/projects/[id]/project-detail-client.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plus, CheckCircle2, Clock, AlertTriangle,
  Circle, CheckCheck, Users, Activity, Calendar,
  Edit3, Save, X
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import ProjectBoard from './project-board'

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled']

export default function ProjectDetailClient({ project: initial, tasks, members, activity, user }: {
  project: any; tasks: any[]; members: any[]; activity: any[]; user: any
}) {
  const [project, setProject] = useState(initial)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(initial.name)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'activity'>('tasks')
  const [showAddMember, setShowAddMember] = useState(false)
  const [addingMember, setAddingMember] = useState('')

  // Calculate stats
  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  async function saveName() {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setProject((p: any) => ({ ...p, name: editName.trim() }))
      toast.success('Project updated')
    } else toast.error('Update failed')
    setSaving(false)
    setEditingName(false)
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setProject((p: any) => ({ ...p, status }))
  }

  async function addMember() {
    if (!addingMember) return
    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: addingMember }),
    })
    if (res.ok) {
      const member = members.find(m => m.id === addingMember)
      if (member) {
        setProject((p: any) => ({
          ...p,
          project_members: [...(p.project_members ?? []), { user_id: member.id, user: member }],
        }))
      }
      setShowAddMember(false)
      setAddingMember('')
      toast.success('Member added')
    }
  }

  const projectMembers = (project.project_members ?? []).map((pm: any) => pm.user).filter(Boolean)
  const nonMembers = members.filter(m => !projectMembers.find((pm: any) => pm.id === m.id))

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Projects
      </Link>

      {/* HEADER */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold text-xl" style={{ background: project.color ?? 'var(--primary)' }}>
            {project.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus className="text-2xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none flex-1" style={{ color: 'var(--text-primary)' }} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }} />
                <button onClick={saveName} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 group">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
                <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}><Edit3 className="w-4 h-4" /></button>
              </div>
            )}

            {project.description && <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}

            <div className="flex items-center gap-3 flex-wrap">
              <select value={project.status} onChange={e => updateStatus(e.target.value)} className="text-xs font-semibold px-3 py-1.5 rounded-xl border capitalize cursor-pointer focus:outline-none" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                {PROJECT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              {project.end_date && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3.5 h-3.5" /> Due {formatDate(project.end_date)}
                </div>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                {projectMembers.slice(0, 5).map((m: any) => (
                  <Avatar key={m.id} size="xs">
                    {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.full_name} /> : <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>}
                  </Avatar>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke={project.color ?? 'var(--primary)'} strokeWidth="6" strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{progress}%</span></div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Complete</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          {[{ label: 'Total', value: stats.total, color: 'var(--text-primary)' }, { label: 'In Progress', value: stats.inProgress, color: '#3B82F6' }, { label: 'Blocked', value: stats.blocked, color: '#EF4444' }, { label: 'Done', value: stats.done, color: '#10B981' }].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b mb-5" style={{ borderColor: 'var(--border)' }}>
        {([['tasks', 'Tasks', stats.total], ['members', 'Members', projectMembers.length], ['activity', 'Activity', activity.length]] as const).map(([t, label, count]) => (
          <button key={t} onClick={() => setActiveTab(t as any)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all" style={{ color: activeTab === t ? 'var(--primary)' : 'var(--text-secondary)', borderBottomColor: activeTab === t ? 'var(--primary)' : 'transparent' }}>
            {label} <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{count}</span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div>
        {activeTab === 'tasks' && (
          <ProjectBoard initialTasks={tasks} projectId={project.id} workspaceId={user.workspaceId} />
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</p>
              {user.roleLevel <= 2 && (
                <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white" style={{ background: 'var(--primary)' }}>
                  <Plus className="w-4 h-4" /> Add member
                </button>
              )}
            </div>
            {showAddMember && nonMembers.length > 0 && (
              <div className="flex gap-2 mb-4">
                <select value={addingMember} onChange={e => setAddingMember(e.target.value)} className="flex-1 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Select team member</option>
                  {nonMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <button onClick={addMember} className="px-4 rounded-xl text-white font-semibold text-sm" style={{ background: 'var(--primary)' }}>Add</button>
              </div>
            )}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
              {projectMembers.map((m: any) => (
                <motion.div key={m.id} variants={staggerItem}>
                  <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <Avatar size="md">{m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.full_name} /> : <AvatarFallback>{getInitials(m.full_name)}</AvatarFallback>}</Avatar>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.full_name}</p>
                      {m.job_title && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.job_title}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {activity.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
              </div>
            ) : (
              activity.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <Avatar size="xs" className="shrink-0 mt-0.5">{log.user?.avatar_url ? <AvatarImage src={log.user.avatar_url} alt={log.user.full_name} /> : <AvatarFallback>{getInitials(log.user?.full_name ?? '?')}</AvatarFallback>}</Avatar>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}><strong>{log.user?.full_name}</strong> {log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}