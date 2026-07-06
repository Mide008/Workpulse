// apps/web/src/app/api/goals/[id]/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

// Zod schema for update operations
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  metricLabel: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  period: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

export const GET = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const supabase = await createServerSupabaseClient()

    const { data: goal, error } = await supabase
      .from('goals')
      .select(`
        *,
        user:users!goals_user_id_fkey(id, full_name, avatar_url),
        setter:users!goals_set_by_fkey(id, full_name)
      `)
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)
      .single()

    if (error || !goal) return Response.json({ error: 'Goal not found' }, { status: 404 })
    return Response.json({ goal })
  },
  { permission: 'view_goals' }
)

export const PATCH = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const d = parsed.data

    // Get current goal state for activity logging
    const { data: current } = await supabase
      .from('goals')
      .select('title, status, target_value, current_value')
      .eq('id', id!)
      .single()

    // Build updates object
    const updates: Record<string, any> = {}
    if (d.title !== undefined) updates.title = d.title
    if (d.description !== undefined) updates.description = d.description
    if (d.status !== undefined) updates.status = d.status
    if (d.metricLabel !== undefined) updates.metric_label = d.metricLabel
    if (d.targetValue !== undefined) updates.target_value = d.targetValue
    if (d.currentValue !== undefined) updates.current_value = d.currentValue
    if (d.period !== undefined) updates.period = d.period
    if (d.startDate !== undefined) updates.start_date = d.startDate
    if (d.dueDate !== undefined) updates.due_date = d.dueDate

    // Cast updates to any to avoid type errors
    const { data: goal, error } = await (supabase
      .from('goals') as any)
      .update(updates)
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)
      .select('id, title, status, target_value, current_value, user_id')
      .single()

    if (error) throw error

    const g = goal as any

    // Log activity for significant changes
    const notifyUsers: string[] = []
    if (g.user_id && g.user_id !== ctx.userId) notifyUsers.push(g.user_id)

    // Status change
    if (d.status && d.status !== current?.status) {
      let action: 'goal_updated' | 'goal_completed' | 'goal_created' = 'goal_updated'
      if (d.status === 'completed') action = 'goal_completed'
      await logActivity({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        entityType: 'goal',
        entityId: g.id,
        entityTitle: g.title,
        action,
        metadata: {
          prevStatus: current?.status,
          newStatus: d.status,
          actorName: ctx.userFullName,
        },
        notifyUserIds: notifyUsers,
      })
    }

    // Target or progress update (if status didn't change)
    if (!d.status || d.status === current?.status) {
      const changedFields = Object.keys(updates).filter(k => k !== 'status')
      if (changedFields.length > 0) {
        await logActivity({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          entityType: 'goal',
          entityId: g.id,
          entityTitle: g.title,
          action: 'goal_updated',
          metadata: {
            fields: changedFields,
            actorName: ctx.userFullName,
          },
          notifyUserIds: notifyUsers,
        })
      }
    }

    return Response.json({ goal })
  },
  { permission: 'set_goals' }
)

export const DELETE = withAuth(
  async (req: NextRequest, ctx) => {
    const id = req.nextUrl.pathname.split('/').at(-1)
    const supabase = await createServerSupabaseClient()

    // Get goal info for logging
    const { data: goal } = await supabase
      .from('goals')
      .select('title, user_id')
      .eq('id', id!)
      .single()

    // Hard delete (you can switch to soft-delete by adding a deleted_at column)
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id!)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error

    // Log deletion – using goal_deleted action
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'goal',
      entityId: id!,
      entityTitle: (goal as any)?.title ?? 'Goal',
      action: 'goal_deleted',
      metadata: {
        actorName: ctx.userFullName,
        userId: (goal as any)?.user_id,
      },
      notifyUserIds: (goal as any)?.user_id && (goal as any).user_id !== ctx.userId ? [(goal as any).user_id] : [],
    })

    return Response.json({ success: true })
  },
  { permission: 'set_goals' }
)