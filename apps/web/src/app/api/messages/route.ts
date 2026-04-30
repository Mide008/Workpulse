import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

const sendSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'file']).default('text'),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  parentMessageId: z.string().uuid().optional(),
})

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')
  const before = searchParams.get('before')
  if (!channelId) return Response.json({ error: 'channelId required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  // Verify user is member of channel
  const { data: member } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('channel_id', channelId)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 })

  let query = supabase
    .from('messages')
    .select(`
      id, content, type, file_url, file_name, file_size, file_type,
      parent_message_id, is_edited, created_at,
      sender:users!messages_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (before) query = query.lt('created_at', before)

  const { data, error } = await query
  if (error) throw error

  return Response.json({ messages: (data ?? []).reverse() })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const d = parsed.data

  const { data: member } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('channel_id', d.channelId)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      channel_id: d.channelId,
      user_id: ctx.userId,
      content: d.content,
      type: d.type,
      file_url: d.fileUrl,
      file_name: d.fileName,
      file_size: d.fileSize,
      file_type: d.fileType,
      parent_message_id: d.parentMessageId,
    })
    .select(`
      id, content, type, file_url, file_name, created_at, is_edited,
      sender:users!messages_user_id_fkey(id, full_name, avatar_url)
    `)
    .single()

  if (error) throw error
  return Response.json({ message }, { status: 201 })
})