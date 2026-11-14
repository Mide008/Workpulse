// apps/web/src/app/(app)/team/team-client.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, Users, CheckCircle2, AlertTriangle, Plus, X, ChevronDown, Copy, Loader2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
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

export default function TeamClient({
  members: initialMembers = [],
  taskCounts = [],
  currentUser,
  roles: availableRoles = [],
  pendingInvites: initialInvites = [],
}: {
  members: any[]
  taskCounts: any[]
  currentUser: any
  roles?: any[]
  pendingInvites?: any[]
}) {
  const [members] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const isManager = currentUser?.roleLevel <= 2

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      fullName: '',
      roleId: availableRoles.find((r: any) => r.name === 'Staff')?.id || availableRoles[0]?.id || '',
      jobTitle: '',
    },
  })

  const taskMap = useMemo(() => {
    const map: Record<string, { total: number; done: number; blocked: number }> = {}
    for (const t of taskCounts) {
      if (!t.assigned_to) continue
      if (!map[t.assigned_to]) map[t.assigned_to] = { total: 0, done: 0, blocked: 0 }
      map[t.assigned_to].total++
      if (t.status === 'done') map[t.assigned_to].done++
      if (t.status === 'blocked') map[t.assigned_to].blocked++
    }
    return map
  }, [taskCounts])

  const rolesList = useMemo(() => {
    const r = new Set(members.map(m => m.role?.name).filter(Boolean))
    return Array.from(r)
  }, [members])

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = filterRole === 'all' || m.role?.name === filterRole
      return matchSearch && matchRole
    })
  }, [members, search, filterRole])

  async function onInviteSubmit(data: InviteFormValues) {
    try {
      setGeneratedLink(null)
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to send invite')

      setGeneratedLink(result.inviteLink)
      setInvites(prev => [...prev, result.invite])
      toast.success('Invite link generated!')
    } catch (error: any) {
      toast.error(error.message || 'Could not complete invitation.')
    }
  }

  async function deleteInvite(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/team/invite/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setInvites(prev => prev.filter(i => i.id !== id))
      toast.success('Invite deleted')
    } else {
      toast.error('Failed to delete invite')
    }
    setDeletingId(null)
  }

  function copyLink() {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Team</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {members.length} active members · {invites.length} pending invites
          </p>
        </div>
        {isManager && (
          <Button variant="primary" onClick={() => { setShowInviteModal(true); setGeneratedLink(null); }}>
            <Plus className="w-4 h-4 mr-2" /> Invite Member
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {filtered.length === 0 && invites.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Your team is empty"
          description="Invite colleagues to your workspace so they can log tasks, track goals, and contribute to your team's KPI scores."
          action={{ label: 'Invite team member', onClick: () => setShowInviteModal(true) }}
        />
      ) : (
        <>
          {/* Active Members */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member, i) => {
              const tasks = taskMap[member.id] ?? { total: 0, done: 0, blocked: 0 }
              const completion = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0

              return (
                <motion.div key={member.id} variants={staggerItem} initial="initial" animate="animate" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link href={`/team/${member.id}`}>
                    <div className="group p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="w-10 h-10 shrink-0">
                          {member.avatar_url ? <AvatarImage src={member.avatar_url} alt={member.full_name} /> : <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-indigo-400 transition-colors">{member.full_name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{member.job_title ?? member.role?.name ?? 'Team Member'}</p>
                          {member.role && <div className="mt-1.5"><Badge variant="default" className="text-[10px]">{member.role.name}</Badge></div>}
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Tasks</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" />{tasks.done}</span>
                            {tasks.blocked > 0 && <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-3 h-3" />{tasks.blocked}</span>}
                            <span className="text-[var(--text-muted)]">/ {tasks.total}</span>
                          </div>
                        </div>
                        <Progress value={completion} size="sm" color={completion >= 70 ? 'emerald' : completion >= 40 ? 'indigo' : 'amber'} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Pending Invites List */}
          {invites.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Pending Invites</h2>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{invite.full_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{invite.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="warning">Pending</Badge>
                      <button 
                        onClick={() => deleteInvite(invite.id)} 
                        disabled={deletingId === invite.id}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Delete Invite"
                      >
                        {deletingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
            <motion.div {...scaleIn} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-[var(--text-primary)] font-semibold text-lg">{generatedLink ? 'Invite Link Ready' : 'Invite team member'}</h3>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>

              {generatedLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)]">Copy this link and send it to your team member.</p>
                  <div className="flex gap-2">
                    <input readOnly value={generatedLink} className="flex-1 h-11 px-3 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border)] text-sm text-[var(--text-primary)]" />
                    <button onClick={copyLink} className="px-4 rounded-xl text-white font-bold bg-indigo-500 hover:bg-indigo-600 transition"><Copy className="w-4 h-4" /></button>
                  </div>
                  <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="w-full">Done</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Full name</label>
                    <input {...register('fullName')} placeholder="Jane Doe" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Email address</label>
                    <input {...register('email')} type="email" placeholder="jane@company.com" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Job title</label>
                    <input {...register('jobTitle')} placeholder="e.g. Senior Product Designer" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    {errors.jobTitle && <p className="text-red-400 text-xs mt-1">{errors.jobTitle.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">System workspace role</label>
                    <div className="relative">
                      <select {...register('roleId')} className="w-full appearance-none bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer">
                        {availableRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : 'Generate Link'}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
