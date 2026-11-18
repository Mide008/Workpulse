// apps/web/src/app/(app)/tasks/[id]/page.tsx
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import TaskDetailClient from './task-detail-client'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return <TaskDetailClient taskId={id} user={user} />
}