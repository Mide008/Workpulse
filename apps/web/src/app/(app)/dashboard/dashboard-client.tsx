'use client'

import Link from 'next/link'
import { CheckSquare, Clock, AlertTriangle, TrendingUp, FolderKanban, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate, getInitials } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  progress: number
}

interface Project {
  id: string
  name: string
  status: string
  priority: string
  progress: number
  end_date: string | null
  color: string
}

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  job_title: string | null
  role: { name: string } | null
}

interface Props {
  user: {
    id: string
    fullName: string
    workspaceName: string
    roleLevel: number
    primaryColor: string
  }
  tasks: Task[]
  teamTasks: Task[] | null
  projects: Project[]
  members: Member[] | null
}

const priorityDot: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

const statusColor: Record<string, string> = {
  not_started: 'text-slate-400',
  in_progress: 'text-blue-400',
  blocked: 'text-red-400',
  review: 'text-purple-400',
  done: 'text-green-400',
}

const statusLabel: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'In Review',
  done: 'Done',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function DashboardClient({ user, tasks, teamTasks, projects, members }: Props) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length

  const isManager = user.roleLevel <= 2

  const stats = [
    {
      label: 'Total Tasks',
      value: total,
      icon: CheckSquare,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Blocked',
      value: blocked,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()},{' '}
          <span className="text-indigo-400">{user.fullName.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-400 mt-1">
          Here&apos;s what&apos;s happening in{' '}
          <span className="text-slate-300">{user.workspaceName}</span> today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm">{stat.label}</span>
                <div className={cn('p-2 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Tasks</CardTitle>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No tasks yet</p>
                  <p className="text-slate-600 text-sm mt-1">Tasks assigned to you will appear here</p>
                  <Link
                    href="/tasks/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600
                      hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
                  >
                    Create your first task
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {tasks.slice(0, 8).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                        hover:bg-white/5 transition group"
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                      <span className="flex-1 text-sm text-slate-300 group-hover:text-white
                        transition truncate">
                        {task.title}
                      </span>
                      <span className={cn('text-xs font-medium shrink-0', statusColor[task.status])}>
                        {statusLabel[task.status]}
                      </span>
                      {task.due_date && (
                        <span
                          className={cn(
                            'text-xs shrink-0',
                            new Date(task.due_date) < new Date() && task.status !== 'done'
                              ? 'text-red-400'
                              : 'text-slate-500'
                          )}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projects</CardTitle>
                <Link
                  href="/projects"
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No projects yet</p>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600
                      hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
                  >
                    Create project
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block px-3 py-3 rounded-xl hover:bg-white/5 transition group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white
                          transition truncate font-medium">
                          {project.name}
                        </span>
                      </div>
                      <Progress value={project.progress} className="mb-1.5" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{project.progress}% complete</span>
                        {project.end_date && (
                          <span className="text-xs text-slate-500">{formatDate(project.end_date)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team overview — managers only */}
      {isManager && members && members.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Overview</CardTitle>
              <Link
                href="/team"
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Full view <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {members.map((member) => {
                const memberTasks = teamTasks?.filter((t: any) => t.assigned_to === member.id) ?? []
                const memberDone = memberTasks.filter((t: any) => t.status === 'done').length
                const memberTotal = memberTasks.length
                return (
                  <Link
                    key={member.id}
                    href={`/team/${member.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5
                      hover:border-indigo-500/30 hover:bg-white/5 transition"
                  >
                    <Avatar size="md" className="ring-2 ring-slate-900">
                    {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt={member.full_name} />
                     ) : (
                     <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{member.full_name}</p>
                      <p className="text-slate-500 text-xs">
                        {memberDone}/{memberTotal} tasks
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}