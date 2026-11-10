'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, MailPlus } from 'lucide-react'
import { spring } from '@/lib/motion'

export default function TeamTabs({ pending, canSeeInvites }: { pending: number; canSeeInvites: boolean }) {
  const path = usePathname()
  const tabs = [{ href: '/team', label: 'Members', icon: Users }, ...(canSeeInvites ? [{ href: '/team/invitations', label: 'Invitations', icon: MailPlus, badge: pending }] : [])]
  if (!canSeeInvites) return null
  return (
    <div className="max-w-7xl mx-auto mb-5">
      <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }} role="tablist">
        {tabs.map(t => {
          const on = t.href === '/team' ? path === '/team' : path.startsWith(t.href)
          return (
            <Link key={t.href} href={t.href} role="tab" aria-selected={on} className="relative h-10 px-4 rounded-lg text-sm font-bold flex items-center gap-2" style={{ color: on ? '#fff' : 'var(--text-secondary)' }}>
              {on && <motion.span layoutId="team-tab" className="absolute inset-0 rounded-lg" style={{ background: 'var(--primary)' }} transition={spring.snappy} />}
              <t.icon className="relative w-4 h-4" /><span className="relative">{t.label}</span>
              {'badge' in t && (t as any).badge > 0 && <span className="relative min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center bg-amber-400 text-slate-900">{(t as any).badge}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
