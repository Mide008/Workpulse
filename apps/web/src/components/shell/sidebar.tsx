// apps/web/src/components/shell/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Target,
  Bell,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkPulseLogo } from '@/components/ui/logo'
import { signOut } from '@/lib/actions/auth'
import {
  SimpleTooltip,
  TooltipProvider,
} from '@/components/ui/tooltip'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, minLevel: 2 },
  { href: '/team', label: 'Team', icon: Users, minLevel: 2 },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

interface SidebarProps {
  user: {
    fullName: string
    email: string
    roleName: string
    roleLevel: number
    workspaceName: string
    workspaceLogo: string | null
    avatarUrl: string | null
    primaryColor: string
  }
  open: boolean
  onClose: () => void
}

export default function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const filteredNav = NAV.filter((item) => !item.minLevel || user.roleLevel <= item.minLevel)

  return (
    <TooltipProvider delayDuration={300}>
      <>
        {/* Mobile overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
        )}

        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col',
            'border-r transition-colors duration-300 ease-out',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border)] shrink-0">
            <WorkPulseLogo />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition rounded-lg hover:bg-[var(--bg-overlay)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace badge */}
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shrink-0 overflow-hidden shadow-sm"
                style={{ backgroundColor: user.primaryColor }}
              >
                {user.workspaceLogo ? (
                  <img src={user.workspaceLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  user.workspaceName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-[var(--text-primary)]">{user.workspaceName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{user.roleName}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <SimpleTooltip key={item.href} content={item.label} side="right">
                  <Link href={item.href} onClick={onClose} className="block">
                    <motion.div
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive ? '' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
                      )}
                      style={
                        isActive
                          ? {
                              background: `color-mix(in srgb, var(--primary, #6366F1) 12%, transparent)`,
                              color: 'var(--primary, #6366F1)',
                            }
                          : undefined
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </motion.div>
                  </Link>
                </SimpleTooltip>
              )
            })}
          </nav>

          {/* Bottom Controls */}
          <div className="px-3 py-4 border-t border-[var(--border)] space-y-0.5 shrink-0">
            <Link
              href="/notifications"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </Link>
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <SimpleTooltip content="Sign out" side="right">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </form>
            </SimpleTooltip>
          </div>
        </aside>
      </>
    </TooltipProvider>
  )
}