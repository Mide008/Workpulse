'use client'

import { Menu, Search, Bell } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

interface HeaderProps {
  user: {
    fullName: string
    email: string
    avatarUrl: string | null
    roleName: string
  }
  onMenuClick: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-400 hover:text-white transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks, projects, people..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2
              text-sm text-white placeholder:text-slate-500 focus:outline-none
              focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 text-slate-400 hover:text-white
            hover:bg-white/5 rounded-xl transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </Link>

        {/* Avatar */}
        <Link href="/settings/profile">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center
            text-white text-sm font-semibold cursor-pointer hover:ring-2
            hover:ring-indigo-500 transition">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.fullName)
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}