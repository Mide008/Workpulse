'use client'

import { useState } from 'react'
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

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 bg-slate-950">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}