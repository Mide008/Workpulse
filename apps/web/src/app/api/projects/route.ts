// apps/web/src/app/api/projects/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamId: z.string().uuid().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
})

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, description, status, priority, color,
      progress, start_date, end_date, tags, created_at, updated_at,
      created_by,
      team:teams(id, name),
      project_members(
        user_id,
        user:users!project_members_user_id_fkey(id, full_name, avatar_url)
      ),
      tasks(id, status)
    `)
    .eq('workspace_id', ctx.workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return Response.json({ projects: data })
})

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const d = parsed.data

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: ctx.workspaceId,
        created_by: ctx.userId,
        name: d.name,
        description: d.description,
        priority: d.priority,
        color: d.color,
        start_date: d.startDate,
        end_date: d.endDate,
        team_id: d.teamId,
      } as any)
      .select('id, name, color, status, created_by')
      .single()

    if (error) throw error

    const pid = (project as any).id

    const memberInserts = [{ project_id: pid, user_id: ctx.userId, role: 'owner' }]
    if (d.memberIds?.length) {
      d.memberIds.filter(id => id !== ctx.userId).forEach(id =>
        memberInserts.push({ project_id: pid, user_id: id, role: 'member' })
      )
    }
    await supabase.from('project_members').insert(memberInserts as any)

    // Log activity using the centralized logger
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'project',
      entityId: pid,
      entityTitle: (project as any).name,
      action: 'project_created',
      metadata: {
        priority: d.priority,
        memberCount: memberInserts.length,
        actorName: ctx.userFullName,
      },
      // Notify all members except the creator
      notifyUserIds: d.memberIds?.filter(id => id !== ctx.userId) ?? [],
    })

    return Response.json({ project }, { status: 201 })
  },
  { permission: 'create_projects' }
)