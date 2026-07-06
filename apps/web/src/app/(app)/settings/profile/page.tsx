// apps/web/src/app/(app)/settings/profile/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import ProfileSettingsClient from './profile-settings-client'

export const metadata = { title: 'Profile Settings' }

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <ProfileSettingsClient user={user} />
}