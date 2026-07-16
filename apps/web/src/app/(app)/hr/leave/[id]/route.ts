// apps/web/src/app/(app)/hr/leave/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split('/').at(-1)
  const body = await req.json()
  const supabase = await createServerSupabaseClient()
  const { data: leave, error } = await (supabase as any)
    .from('leave_requests')
    .update({ 
      status: body.status, 
      reviewed_by: ctx.userId, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', id!)
    .eq('workspace_id', ctx.workspaceId)
    .select('*')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ leave })
})