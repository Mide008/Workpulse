import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const sendSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'file']).default('text'),
  parentMessageId: z.string().uuid().optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')
  if (!channelId) return Response.json({ error: 'channelId required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`id, content, type, file_url, file_name, file_size, parent_message_id, is_edited, created_at, sender:users!messages_user_id_fkey(id, full_name, avatar_url)`)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('messages GET error:', error)
    return Response.json({ messages: [] })
  }

  return Response.json({ messages: messages ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const d = parsed.data

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      channel_id: d.channelId,
      user_id: ctx.userId,
      content: d.content,
      type: d.type,
      parent_message_id: d.parentMessageId,
    })
    .select(`id, content, type, created_at, is_edited, sender:users!messages_user_id_fkey(id, full_name, avatar_url)`)
    .single()

  if (error) {
    console.error('messages POST error:', error)
    return Response.json({ error: error.message }, { status: 403 })
  }

  return Response.json({ message }, { status: 201 })
})