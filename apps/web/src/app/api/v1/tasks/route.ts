// apps/web/src/app/api/v1/tasks/route.ts
export const dynamic = 'force-dynamic'

import { validateApiKey } from '@/lib/api-key'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

async function withApiKey(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const key = authHeader?.replace('Bearer ', '') ?? req.headers.get('x-api-key') ?? ''
  return validateApiKey(key)
}

export async function GET(req: NextRequest) {
  const auth = await withApiKey(req)
  if (!auth.valid) return Response.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)

  let query = adminClient
    .from('tasks')
    .select('id, title, description, status, priority, due_date, assigned_to, project_id, progress, created_at, completed_at')
    .eq('workspace_id', auth.workspaceId!)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ data: data ?? [], count: data?.length ?? 0 }, {
    headers: {
      'X-WorkPulse-Version': '1',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Remaining': '999',
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await withApiKey(req)
  if (!auth.valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.scopes?.includes('write')) return Response.json({ error: 'Write scope required' }, { status: 403 })

  const body = await req.json()
  if (!body.title) return Response.json({ error: 'title is required' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: task, error } = await adminClient
    .from('tasks')
    .insert({
      workspace_id: auth.workspaceId!,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? 'medium',
      status: body.status ?? 'not_started',
      due_date: body.due_date ?? null,
      assigned_to: body.assigned_to ?? null,
      project_id: body.project_id ?? null,
    })
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data: task }, { status: 201 })
}