// apps/web/src/app/(app)/crm/layout.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { canAccess } from '@/lib/plans'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', user.workspaceId)
    .single()

  const plan = ((workspace as any)?.plan ?? 'free') as any

  if (!canAccess(plan, 'crm')) {
    const { default: UpgradeGate } = await import('@/components/ui/upgrade-gate')
    return (
      <UpgradeGate
        feature="CRM"
        description="The CRM module gives you a full contact database, deal pipeline, company records, and activity tracking. Upgrade to Pro to unlock it for your team."
      />
    )
  }

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const tabs = [
    { href: '/crm/pipeline', label: 'Pipeline' },
    { href: '/crm/contacts', label: 'Contacts' },
    { href: '/crm/companies', label: 'Companies' },
    { href: '/crm/activities', label: 'Activities' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)' }}>
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