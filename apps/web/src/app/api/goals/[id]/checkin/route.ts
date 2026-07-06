// apps/web/src/app/api/goals/[id]/checkin/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const goalId = req.nextUrl.pathname.split('/').at(-2)
  const { progressValue, note } = await req.json()

  if (progressValue === undefined || progressValue === null) {
    return Response.json({ error: 'progressValue is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Cast supabase to any to bypass type checks for goal_checkins table
  const { data: goal } = await supabase
    .from('goals')
    .select('title, user_id, target_value')
    .eq('id', goalId!)
    .single()

  const { data: checkin, error } = await (supabase as any)
    .from('goal_checkins')
    .insert({
      workspace_id: ctx.workspaceId,
      goal_id: goalId,
      user_id: ctx.userId,
      progress_value: progressValue,
      note: note?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Update current_value on the goal
  const isCompleted = progressValue >= ((goal as any)?.target_value ?? 100)
  await supabase
    .from('goals')
    .update({
      current_value: progressValue,
      ...(isCompleted ? { status: 'completed' } : {}),
    })
    .eq('id', goalId!)

  const notifyUsers: string[] = []
  if ((goal as any)?.user_id && (goal as any).user_id !== ctx.userId) {
    notifyUsers.push((goal as any).user_id)
  }

  await logActivity({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    entityType: 'goal',
    entityId: goalId!,
    entityTitle: (goal as any)?.title ?? 'Goal',
    action: isCompleted ? 'goal_completed' : 'goal_checkin',
    metadata: { progressValue, note, actorName: ctx.userFullName },
    notifyUserIds: notifyUsers,
  })

  return Response.json({ checkin, isCompleted }, { status: 201 })
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const goalId = req.nextUrl.pathname.split('/').at(-2)
  const supabase = await createServerSupabaseClient()

  // Cast supabase to any
  const { data } = await (supabase as any)
    .from('goal_checkins')
    .select('*, user:users!goal_checkins_user_id_fkey(id, full_name, avatar_url)')
    .eq('goal_id', goalId!)
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })

  return Response.json({ checkins: data ?? [] })
})