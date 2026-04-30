import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const schema = z.object({
  content: z.string().min(1).max(5000),
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const segments = req.nextUrl.pathname.split('/')
  const id = segments[segments.indexOf('tasks') + 1]

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ task_id: id, user_id: ctx.userId, content: parsed.data.content })
    .select('id, content, created_at, is_edited')
    .single()

  if (error) throw error

  return Response.json({ comment }, { status: 201 })
})