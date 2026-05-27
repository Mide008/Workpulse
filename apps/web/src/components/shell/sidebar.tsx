'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users,
  BarChart3, MessageSquare, Settings, Target,
  Bell, LogOut, X, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkPulseLogo } from '@/components/ui/logo'
import { signOut } from '@/lib/actions/auth'

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
  const filteredNav = NAV.filter(item => !item.minLevel || user.roleLevel <= item.minLevel)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col',
        'bg-slate-900 border-r border-white/5 transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
          <WorkPulseLogo />
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace badge */}
        <div className="px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
              style={{ backgroundColor: user.primaryColor }}
            >
              {user.workspaceLogo ? (
                <img src={user.workspaceLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                user.workspaceName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.workspaceName}</p>
              <p className="text-slate-500 text-xs truncate">{user.roleName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
                style={isActive ? { backgroundColor: user.primaryColor } : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/5 space-y-0.5 shrink-0">
          <Link href="/notifications" onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">
            <Bell className="w-4 h-4" />
            Notifications
          </Link>
          <Link href="/settings" onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <form action={signOut}>
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}