// apps/web/src/app/api/v1/kpi/route.ts
export const dynamic = 'force-dynamic'

import { validateApiKey } from '@/lib/api-key'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function calcScore(tasks: any[]) {
  const total = tasks.length
  if (!total) return { overallScore: 0, completionRate: 0, onTimeRate: 0 }
  const done = tasks.filter(t => t.status === 'done').length
  const completionRate = Math.round((done / total) * 100)
  const onTime = tasks.filter(t =>
    t.status === 'done' && t.completed_at && t.due_date &&
    new Date(t.completed_at) <= new Date(t.due_date)
  ).length
  const onTimeRate = done > 0 ? Math.round((onTime / done) * 100) : 0
  const overallScore = Math.round(completionRate * 0.6 + onTimeRate * 0.4)
  return { overallScore, completionRate, onTimeRate, total, done }
}

export async function GET(req: NextRequest) {
  const key = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.headers.get('x-api-key') ?? ''
  const auth = await validateApiKey(key)
  if (!auth.valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: tasks } = await adminClient
    .from('tasks')
    .select('id, status, priority, due_date, completed_at, assigned_to')
    .eq('workspace_id', auth.workspaceId!)
    .is('deleted_at', null)

  const { data: members } = await adminClient
    .from('users')
    .select('id, full_name')
    .eq('workspace_id', auth.workspaceId!)

  const all = tasks ?? []
  const workspace = calcScore(all)

  const byMember = (members ?? []).map(m => ({
    userId: m.id,
    fullName: m.full_name,
    ...calcScore(all.filter(t => t.assigned_to === m.id)),
  }))

  return Response.json({
    data: {
      workspace,
      members: byMember,
      generatedAt: new Date().toISOString(),
    },
  })
}