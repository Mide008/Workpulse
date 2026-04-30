'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Users, Mail, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { staggerItem } from '@/lib/motion'

export default function TeamClient({ members, taskCounts, currentUser }: {
  members: any[]; taskCounts: any[]; currentUser: any
}) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const taskMap = useMemo(() => {
    const map: Record<string, { total: number; done: number; blocked: number; inProgress: number }> = {}
    for (const t of taskCounts) {
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

  const filtered = useMemo(() =>
    members.filter(m => {
      const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
        || m.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = filterRole === 'all' || m.role?.name === filterRole
      return matchSearch && matchRole && m.is_active
    }), [members, search, filterRole])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {members.filter(m => m.is_active).length} active members
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search team..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4
              py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none
              focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
          <button onClick={() => setFilterRole('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterRole === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}>
            All
          </button>
          {roles.map(role => (
            <button key={role} onClick={() => setFilterRole(role)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterRole === role ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}>
              {role}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No team members found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const tasks = taskMap[member.id] ?? { total: 0, done: 0, blocked: 0, inProgress: 0 }
            const completion = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0
            return (
              <motion.div key={member.id} variants={staggerItem} initial="initial"
                animate="animate" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={`/team/${member.id}`}>
                  <div className="group p-5 rounded-2xl bg-slate-900/80 border border-white/[0.06]
                    hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5
                    hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar size="md">
                        {member.avatar_url
                          ? <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          : <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        }
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {member.full_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
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
                        <span className="text-slate-500">Tasks</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />{tasks.done}
                          </span>
                          {tasks.blocked > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                              <AlertTriangle className="w-3 h-3" />{tasks.blocked}
                            </span>
                          )}
                          <span className="text-slate-500">/ {tasks.total}</span>
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
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}