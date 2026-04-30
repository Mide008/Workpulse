import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const createSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  metricLabel: z.string().optional(),
  targetValue: z.number().default(100),
  period: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  startDate: z.string(),
  dueDate: z.string(),
})

export const GET = withAuth(
  async (req: NextRequest, ctx) => {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('goals')
      .select(`
        *,
        user:users!goals_user_id_fkey(id, full_name, avatar_url),
        setter:users!goals_set_by_fkey(id, full_name)
      `)
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)
    else if (ctx.roleLevel > 2) query = query.eq('user_id', ctx.userId)

    const { data, error } = await query
    if (error) throw error
    return Response.json({ goals: data })
  },
  { permission: 'view_goals' }
)

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const d = parsed.data

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: d.userId,
        set_by: ctx.userId,
        title: d.title,
        description: d.description,
        metric_label: d.metricLabel,
        target_value: d.targetValue,
        period: d.period,
        start_date: d.startDate,
        due_date: d.dueDate,
      })
      .select('id, title, status')
      .single()

    if (error) throw error
    return Response.json({ goal }, { status: 201 })
  },
  { permission: 'set_goals' }
)