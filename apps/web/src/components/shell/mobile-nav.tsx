'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderKanban, BarChart3, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40
      bg-slate-900/95 backdrop-blur-xl border-t border-white/[0.06]
      safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0',
                isActive ? 'text-indigo-400' : 'text-slate-500 active:text-white'
              )}>
              <tab.icon className={cn('w-5 h-5 shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]')} />
              <span className="text-[10px] font-medium truncate">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}