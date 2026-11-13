// apps/web/src/app/(app)/settings/page.tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/settings/workspace')
}