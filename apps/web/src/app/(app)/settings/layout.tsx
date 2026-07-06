// apps/web/src/app/(app)/settings/layout.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const tabs = [
    { href: '/settings/workspace', label: 'Workspace' },
    { href: '/settings/profile', label: 'Profile' },
    ...(user.roleLevel <= 1 ? [{ href: '/settings/billing', label: 'Billing & Plan' }] : []),
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'var(--bg-elevated)' }}>
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={pathname.includes(tab.href)
              ? { background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }
              : { color: 'var(--text-secondary)' }
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}