// apps/web/src/app/api/reports/mark-generated/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  // Cast to any to fix TypeScript error with custom RPC
  await (supabase as any).rpc('mark_onboarding_step', {
    workspace_id_param: ctx.workspaceId,
    step_name: 'generated_report',
  })
  return Response.json({ success: true })
})