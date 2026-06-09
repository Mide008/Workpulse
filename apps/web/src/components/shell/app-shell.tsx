// apps/web/src/components/shell/app-shell.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import Header from './header'
import MobileNav from './mobile-nav'

interface AppShellProps {
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
    roleName: string
    roleLevel: number
    workspaceId: string
    workspaceName: string
    workspaceLogo: string | null
    primaryColor: string
    plan: string
  }
  children: React.ReactNode
}

export default function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-200"
      style={{ 
        background: 'var(--bg-base)',
        '--primary': user.primaryColor 
      } as React.CSSProperties}
    >
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto transition-colors duration-200" style={{ background: 'var(--bg-base)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="p-4 md:p-6 pb-20 lg:pb-6 min-h-full text-[var(--text-primary)]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}