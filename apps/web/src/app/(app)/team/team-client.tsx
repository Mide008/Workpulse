// apps/web/src/app/(app)/team/team-client.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, Users, Mail, CheckCircle2, Clock, AlertTriangle, Plus, X, ChevronDown, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { scaleIn, staggerItem } from '@/lib/motion'
import { ToggleButton } from '@/components/ui/toggle-button'
import { EmptyState } from '@/components/ui/empty-state'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(1, 'Full name required'),
  roleId: z.string().min(1, 'Please select a job role'),
  jobTitle: z.string().min(1, 'Job title required'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

// Simple list of known disposable email domains for UX warning
const DISPOSABLE_DOMAINS = ['mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'yopmail.com']

export default function TeamClient({
  members: initialMembers = [],
  taskCounts = [],
  currentUser,
  roles: availableRoles = [],
}: {
  members: any[]
  taskCounts: any[]
  currentUser: any
  roles?: any[]
}) {
  const [members, setMembers] = useState(initialMembers)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  
  const isManager = currentUser?.roleLevel <= 2

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/team/invite')
      if (res.ok) {
        const data = await res.json()
        setPendingInvites(data.invites || [])
      }
    } catch (err) {
      console.error('Failed to load invites', err)
    }
  }

  useEffect(() => {
    if (isManager) fetchInvites()
  }, [isManager])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      fullName: '',
      roleId: availableRoles[0]?.id || '',
      jobTitle: '',
    },
  })

  const emailValue = watch('email')
  const isDisposable = emailValue && DISPOSABLE_DOMAINS.some(d => emailValue.toLowerCase().endsWith(`@${d}`))

  const taskMap = useMemo(() => {
    const map: Record<string, { total: number; done: number; blocked: number; inProgress: number }> = {}
    for (const t of taskCounts) {
      if (!t.assigned_to) continue
      if (!map[t.assigned_to]) map[t.assigned_to] = { total: 0, done: 0, blocked: 0, inProgress: 0 }
      map[t.assigned_to].total++
      if (t.status === 'done') map[t.assigned_to].done++
      if (t.status === 'blocked') map[t.assigned_to].blocked++
      if (t.status === 'in_progress') map[t.assigned_to].inProgress++
    }
    return map
  }, [taskCounts])

  const roles = useMemo(() => {
    const r = new Set(members.map(m => m.role?.name).filter(Boolean))
    return Array.from(r)
  }, [members])

  // THE FIX: Ensure we show members whose is_active is true or null (legacy), and apply search
  const filtered = useMemo(() => {
    return members.filter(m => {
      const isActive = m.is_active !== false
      const matchSearch =
        !search ||
        m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = filterRole === 'all' || m.role?.name === filterRole
      return isActive && matchSearch && matchRole
    })
  }, [members, search, filterRole])

  async function onInviteSubmit(data: InviteFormValues) {
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to send invite')
      }

      if (json.duplicate) {
        toast.info(json.message || 'This email already has a pending invite.')
      } else {
        toast.success('Invitation sent to team member')
      }
      
      reset()
      setShowInviteModal(false)
      fetchInvites() // Refresh the pending list
    } catch (error: any) {
      toast.error(error.message || 'Could not complete invitation.')
    }
  }

  async function handleRemoveMember(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from the workspace? They will lose access immediately.`)) return
    setRemovingId(id)
    try {
      const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove member')
      
      setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: false } : m))
      toast.success(`${name} has been removed.`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Team</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {filtered.length} active members
          </p>
        </div>
        {isManager && (
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        )}
      </div>

      {/* PENDING INVITES SECTION */}
      {isManager && pendingInvites.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--primary)]" /> Pending Invitations ({pendingInvites.length})
          </h2>
          <div className="space-y-3">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{inv.email}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Role: {inv.role?.name || 'Member'} • Expires: {new Date(inv.expires_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(inv.inviteLink)
                    toast.success('Invite link copied')
                  }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded-lg transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button onClick={async () => {
                    if(!confirm('Revoke this invite?')) return;
                    await fetch(`/api/team/invite/${inv.id}`, { method: 'DELETE' });
                    fetchInvites();
                    toast.success('Invite revoked');
                  }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search team by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-[var(--border)] rounded-xl p-1">
          <ToggleButton active={filterRole === 'all'} onClick={() => setFilterRole('all')}>
            All
          </ToggleButton>
          {roles.map(role => (
            <ToggleButton key={role} active={filterRole === role} onClick={() => setFilterRole(role)}>
              {role}
            </ToggleButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title={search ? 'No members found' : 'Your team is empty'}
          description={search ? `No team members match "${search}".` : 'Invite colleagues to your workspace so they can log tasks, track goals, and contribute to your team.'}
          action={!search ? { label: 'Invite team member', onClick: () => setShowInviteModal(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const tasks = taskMap[member.id] ?? { total: 0, done: 0, blocked: 0, inProgress: 0 }
            const completion = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0

            return (
              <motion.div
                key={member.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                style={{ animationDelay: `${i * 40}ms` }}
                className="relative group"
              >
                <Link href={`/team/${member.id}`}>
                  <div className="p-5 rounded-2xl bg-[var(--bg-surface)]/80 border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="w-10 h-10 shrink-0">
                        {member.avatar_url ? (
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        ) : (
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1 pr-6"> {/* Padding right for the delete button */}
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                          {member.full_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          {member.job_title ?? member.role?.name ?? 'Team Member'}
                        </p>
                        {member.role && (
                          <div className="mt-1.5">
                            <Badge variant="default" className="text-[10px]">
                              {member.role.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Tasks</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {tasks.done}
                          </span>
                          {tasks.blocked > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              {tasks.blocked}
                            </span>
                          )}
                          <span className="text-[var(--text-muted)]">/ {tasks.total}</span>
                        </div>
                      </div>
                      <Progress
                        value={completion}
                        size="sm"
                        color={completion >= 70 ? 'emerald' : completion >= 40 ? 'indigo' : 'amber'}
                      />
                    </div>
                  </div>
                </Link>
                
                {/* Remove Member Button (only visible to managers on hover) */}
                {isManager && currentUser.id !== member.id && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemoveMember(member.id, member.full_name)
                    }}
                    disabled={removingId === member.id}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                    title="Remove from team"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              {...scaleIn}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-[var(--text-primary)] font-semibold text-lg">Add team member</h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Full name</label>
                  <input
                    {...register('fullName')}
                    placeholder="Jane Doe"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Email address</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="jane@company.com"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  {isDisposable && (
                    <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Warning: This looks like a temporary email. The invite may not be received.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Job title</label>
                  <input
                    {...register('jobTitle')}
                    placeholder="e.g. Senior Product Designer"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                  />
                  {errors.jobTitle && <p className="text-red-400 text-xs mt-1">{errors.jobTitle.message}</p>}
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">System workspace role</label>
                  <div className="relative">
                    <select
                      {...register('roleId')}
                      className="w-full appearance-none bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all cursor-pointer"
                    >
                      {availableRoles.length > 0 ? (
                        availableRoles.map(r => (
                          <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                            {r.name}
                          </option>
                        ))
                      ) : (
                        <option value="" className="bg-slate-900 text-white">Standard Member</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Add Member'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}