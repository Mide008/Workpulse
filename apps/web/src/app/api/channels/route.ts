import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const schema = z.object({
  name: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).default('public'),
  memberIds: z.array(z.string().uuid()).optional(),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const d = parsed.data

  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      name: d.name,
      description: d.description,
      type: d.type,
    })
    .select('id, name, description, type')
    .single()

  if (error) throw error

  const memberIds = [...new Set([ctx.userId, ...(d.memberIds ?? [])])]
  await supabase.from('channel_members').insert(
    memberIds.map(uid => ({ channel_id: (channel as any).id, user_id: uid }))
  )

  return Response.json({ channel }, { status: 201 })
})