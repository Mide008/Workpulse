// apps/web/src/components/shell/sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  Building2,
  Activity,
  CreditCard,
  Bot,
  Shield,
  UserCog,
  ChevronLeft,
  ChevronRight,
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
  { href: '/agents', label: 'Agents', icon: Bot, minLevel: 2 },
]

const CRM_NAV = [
  { href: '/crm/pipeline', label: 'Pipeline', icon: TrendingUp },
  { href: '/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/crm/companies', label: 'Companies', icon: Building2 },
  { href: '/crm/activities', label: 'Activities', icon: Activity },
]

const ADMIN_NAV = [
  { href: '/audit', label: 'Audit Trail', icon: Shield, minLevel: 1 },
  { href: '/hr', label: 'HR', icon: UserCog, minLevel: 2 },
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
    plan: string
  }
  open: boolean
  onClose: () => void
}

export default function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
  }, [])

  // Toggle and persist
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const filteredNav = NAV.filter((item) => !item.minLevel || user.roleLevel <= item.minLevel)
  const filteredAdminNav = ADMIN_NAV.filter((item) => !item.minLevel || user.roleLevel <= item.minLevel)

  const showCRM = (user.plan === 'pro' || user.plan === 'enterprise') && user.roleLevel <= 2
  const showAdmin = filteredAdminNav.length > 0

  // Helper for nav items
  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <SimpleTooltip key={item.href} content={item.label} side="right" disabled={!collapsed}>
        <Link href={item.href} onClick={onClose} className="block">
          <motion.div
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive ? '' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
              collapsed && 'justify-center px-2'
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
            {!collapsed && <span>{item.label}</span>}
          </motion.div>
        </Link>
      </SimpleTooltip>
    )
  }

  const renderSectionLabel = (label: string) => {
    if (collapsed) return null
    return (
      <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    )
  }

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
            'fixed lg:static inset-y-0 left-0 z-50 flex flex-col',
            'border-r transition-all duration-300 ease-in-out',
            collapsed ? 'w-16' : 'w-64',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)] shrink-0">
            {!collapsed ? (
              <WorkPulseLogo />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                W
              </div>
            )}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Workspace badge – hidden when collapsed */}
          {!collapsed && (
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
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {filteredNav.map(renderNavItem)}

            {/* CRM Section */}
            {showCRM && (
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                {renderSectionLabel('CRM')}
                {CRM_NAV.map(renderNavItem)}
              </div>
            )}

            {/* Administration Section */}
            {showAdmin && (
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                {renderSectionLabel('Administration')}
                {filteredAdminNav.map(renderNavItem)}
              </div>
            )}
          </nav>

          {/* Bottom Controls */}
          <div className="px-3 py-4 border-t border-[var(--border)] space-y-0.5 shrink-0">
            {[
              { href: '/notifications', label: 'Notifications', icon: Bell },
              { href: '/settings', label: 'Settings', icon: Settings },
              ...(user.roleLevel <= 1
                ? [{ href: '/settings/billing', label: 'Billing', icon: CreditCard }]
                : []),
            ].map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <SimpleTooltip key={item.href} content={item.label} side="right" disabled={!collapsed}>
                  <Link href={item.href} onClick={onClose} className="block">
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? ''
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
                        collapsed && 'justify-center px-2'
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
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                </SimpleTooltip>
              )
            })}

            {/* Sign out */}
            <SimpleTooltip content="Sign out" side="right" disabled={!collapsed}>
              <form action={signOut} className={cn(collapsed && 'flex justify-center')}>
                <button
                  type="submit"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                    'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/5',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Sign out</span>}
                </button>
              </form>
            </SimpleTooltip>
          </div>
        </aside>
      </>
    </TooltipProvider>
  )
}