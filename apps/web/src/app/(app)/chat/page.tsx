export const dynamic = 'force-dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import ChatClient from './chat-client'

export const metadata = { title: 'Chat' }

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>
}) {
  const sp = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  // Get all channels user is member of
  const { data: memberChannels } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('user_id', user.id)

  const channelIds = (memberChannels ?? []).map((c: any) => c.channel_id)

  let channels: any[] = []
  if (channelIds.length > 0) {
    const { data } = await supabase
      .from('channels')
      .select('id, name, description, type, created_at')
      .eq('workspace_id', user.workspaceId)
      .eq('is_archived', false)
      .in('id', channelIds)
      .order('name')
    channels = data ?? []
  }

  // Get public channels not yet joined
  const { data: publicChannels } = await supabase
    .from('channels')
    .select('id, name, description, type')
    .eq('workspace_id', user.workspaceId)
    .eq('type', 'public')
    .eq('is_archived', false)
    .not('id', 'in', `(${channelIds.length > 0 ? channelIds.join(',') : 'null'})`)

  // Get workspace members for DMs
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, job_title')
    .eq('workspace_id', user.workspaceId)
    .eq('is_active', true)
    .neq('id', user.id)

  return (
    <ChatClient
      channels={channels}
      publicChannels={(publicChannels as any[]) ?? []}
      members={(members as any[]) ?? []}
      currentUser={user}
      activeChannelId={sp.channel}
    />
  )
}