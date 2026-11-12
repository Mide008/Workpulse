// apps/web/src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || !p?.workspace_id) return NextResponse.json({ results: [] })

  const query = `%${q}%`

  const [tasks, projects, approvals, standups] = await Promise.all([
    sb.from('tasks').select('id, title, status').eq('workspace_id', p.workspace_id).ilike('title', query).limit(4),
    sb.from('projects').select('id, name').eq('workspace_id', p.workspace_id).ilike('name', query).limit(4),
    (sb as any).from('approvals').select('id, title, status').eq('workspace_id', p.workspace_id).ilike('title', query).limit(4),
    (sb as any).from('standup_logs').select('id, did').eq('workspace_id', p.workspace_id).ilike('did', query).limit(4),
  ])

  const results = [
    ...(tasks.data || []).map((t: any) => ({ id: t.id, title: t.title, type: 'task', href: `/tasks/${t.id}`, subtitle: t.status })),
    ...(projects.data || []).map((t: any) => ({ id: t.id, title: t.name, type: 'project', href: `/projects/${t.id}`, subtitle: 'Project' })),
    ...(approvals.data || []).map((t: any) => ({ id: t.id, title: t.title, type: 'approval', href: `/approvals`, subtitle: t.status })),
    ...(standups.data || []).map((t: any) => ({ id: t.id, title: t.did, type: 'worklog', href: `/standup`, subtitle: 'Work log' })),
  ]

  return NextResponse.json({ results })
}