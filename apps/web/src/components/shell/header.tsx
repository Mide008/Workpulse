// apps/web/src/components/shell/header.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Settings, Menu } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import ThemeToggle from '@/components/ui/theme-toggle'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user: {
    fullName: string
    email: string
    avatarUrl: string | null
    roleName: string
    workspaceName: string
    workspaceLogo: string | null
    primaryColor: string
  }
  onMenuClick: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname()

  const pageTitle = (() => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/tasks/new')) return 'New Task'
    if (pathname.startsWith('/tasks')) return 'Tasks'
    if (pathname.startsWith('/projects/new')) return 'New Project'
    if (pathname.startsWith('/projects')) return 'Projects'
    if (pathname.startsWith('/analytics')) return 'Analytics'
    if (pathname.startsWith('/team')) return 'Team'
    if (pathname.startsWith('/goals')) return 'Goals'
    if (pathname.startsWith('/chat')) return 'Chat'
    if (pathname.startsWith('/notifications')) return 'Notifications'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'WorkPulse'
  })()

  return (
    <TooltipProvider>
      <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 transition-colors"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
            style={{ color: 'var(--text-secondary)' }}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/notifications"
                className={cn(
                  'relative p-2.5 rounded-xl transition-all',
                  'hover:bg-black/5 dark:hover:bg-white/10',
                  pathname === '/notifications' && 'bg-indigo-500/10'
                )}>
                <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings/workspace"
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  'hover:bg-black/5 dark:hover:bg-white/10',
                  pathname.startsWith('/settings') && 'bg-indigo-500/10'
                )}>
                <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Link href="/settings/profile"
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
              hover:bg-black/5 dark:hover:bg-white/10 transition-all ml-1">
            <Avatar size="sm">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.fullName} className="object-cover" />
              ) : (
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
              )}
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                {user.fullName}
              </p>
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'var(--text-muted)' }}>
                {user.roleName}
              </p>
            </div>
          </Link>
        </div>
      </header>
    </TooltipProvider>
  )
}