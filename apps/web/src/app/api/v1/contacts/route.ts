// apps/web/src/app/api/v1/contacts/route.ts
export const dynamic = 'force-dynamic'

import { validateApiKey } from '@/lib/api-key'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const key = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.headers.get('x-api-key') ?? ''
  const auth = await validateApiKey(key)
  if (!auth.valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await adminClient
    .from('contacts')
    .select('id, full_name, email, phone, job_title, status, source, tags, created_at')
    .eq('workspace_id', auth.workspaceId!)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data: data ?? [], count: data?.length ?? 0 })
}