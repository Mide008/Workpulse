// apps/web/src/app/(app)/chat/chat-client.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, MessageSquare, Plus, Send, Search,
  Users, Lock, ChevronDown, X, Loader2,
  Paperclip, Smile,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, getInitials, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface Message {
  id: string
  content: string | null
  type: string
  file_url: string | null
  file_name: string | null
  created_at: string
  is_edited: boolean
  sender: { id: string; full_name: string; avatar_url: string | null } | null
}

interface Channel {
  id: string
  name: string
  description: string | null
  type: string
}

export default function ChatClient({
  channels: initialChannels,
  publicChannels,
  members,
  currentUser,
  activeChannelId,
}: {
  channels: Channel[]
  publicChannels: Channel[]
  members: any[]
  currentUser: any
  activeChannelId?: string
}) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(
    channels.find(c => c.id === activeChannelId) ?? channels[0] ?? null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelType, setNewChannelType] = useState('public')
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!activeChannel) return

    setLoading(true)
    fetch(`/api/messages?channelId=${activeChannel.id}`)
      .then(r => r.json())
      .then(({ messages: msgs }) => {
        setMessages(msgs ?? [])
        setTimeout(scrollToBottom, 100)
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [activeChannel?.id, scrollToBottom])

  useEffect(() => {
    if (!activeChannel) return

    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async payload => {
          const { data } = await supabase
            .from('messages')
            .select(`
              id, content, type, file_url, file_name, created_at, is_edited,
              sender:users!messages_user_id_fkey(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data as any])
            setTimeout(scrollToBottom, 50)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannel?.id, supabase, scrollToBottom])

  async function sendMessage() {
    if (!input.trim() || !activeChannel || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content,
      type: 'text',
      file_url: null,
      file_name: null,
      created_at: new Date().toISOString(),
      is_edited: false,
      sender: {
        id: currentUser.id,
        full_name: currentUser.fullName || currentUser.full_name,
        avatar_url: currentUser.avatarUrl || currentUser.avatar_url,
      },
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(scrollToBottom, 50)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannel.id, content }),
      })

      if (!res.ok) {
        throw new Error()
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      toast.error('Failed to send message')
      setInput(content)
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function createChannel() {
    if (!newChannelName.trim()) return
    const formattedName = newChannelName.toLowerCase().replace(/\s+/g, '-')

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          description: newChannelDesc.trim() || null,
          type: newChannelType,
        }),
      })

      if (!res.ok) {
        throw new Error()
      }

      const { channel } = await res.json()
      setChannels(prev => [...prev, channel])
      setShowNewChannel(false)
      setNewChannelName('')
      setNewChannelDesc('')
      setNewChannelType('public')
      setActiveChannel(channel)
      toast.success(`#${channel.name} created successfully`)
    } catch {
      toast.error('Failed to create channel')
    }
  }

  const filteredMembers = members.filter(m =>
    !search || m.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const groupedMessages = messages.reduce((acc: any[], msg, i) => {
    const prev = messages[i - 1]
    const sameAuthor = prev?.sender?.id === msg.sender?.id
    const withinMinute = prev && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 60000
    return [...acc, { ...msg, grouped: sameAuthor && withinMinute }]
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto -mt-6 -mx-6">
      {/* Sidebar */}
      <div className="w-60 shrink-0 bg-[var(--bg-surface)]/50 border-r border-[var(--border)][0.06] flex flex-col">
        <div className="p-4 border-b border-[var(--border)][0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-[var(--border)][0.06] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Channels
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNewChannel(true)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>New channel</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-0.5">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all text-left',
                    activeChannel?.id === ch.id
                      ? 'text-white'  // active text colour
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                  style={activeChannel?.id === ch.id ? { background: 'var(--primary)' } : undefined}
                >
                  {ch.type === 'private' ? (
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredMembers.length > 0 && (
            <div>
              <div className="flex items-center px-2 mb-1">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Direct Messages
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredMembers.slice(0, 8).map(member => (
                  <button
                    key={member.id}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-left"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-6 h-6">
                        {member.avatar_url ? (
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        ) : (
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-slate-900" />
                    </div>
                    <span className="truncate text-xs">{member.full_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            <div className="h-14 border-b border-[var(--border)][0.06] flex items-center px-5 gap-3 shrink-0">
              {activeChannel.type === 'private' ? (
                <Lock className="w-4 h-4 text-[var(--text-secondary)]" />
              ) : (
                <Hash className="w-4 h-4 text-[var(--text-secondary)]" />
              )}
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <p className="text-xs text-[var(--text-muted)] truncate">{activeChannel.description}</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Hash className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-[var(--text-secondary)] font-medium">Start the conversation</p>
                  <p className="text-slate-600 text-sm">Be the first to message in #{activeChannel.name}</p>
                </div>
              ) : (
                <>
                  {groupedMessages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender?.id === currentUser.id}
                      grouped={msg.grouped}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)][0.06]">
              <div className="flex items-end gap-3 bg-white/[0.04] border border-[var(--border)]10 rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`Message #${activeChannel.name}`}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-slate-600 resize-none focus:outline-none max-h-32 leading-relaxed"
                  style={{ height: 'auto' }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition rounded-lg hover:bg-white/5">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition rounded-lg hover:bg-white/5">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="p-1.5 transition rounded-lg hover:bg-[var(--primary)]/10 disabled:cursor-not-allowed"
                    style={{ color: 'var(--primary)' }}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 px-1">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageSquare className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-1">Select a channel</h3>
            <p className="text-[var(--text-muted)] text-sm">Choose a channel from the sidebar to start messaging</p>
            {channels.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowNewChannel(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Create first channel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New channel modal */}
      <AnimatePresence>
        {showNewChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewChannel(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-surface)] border border-[var(--border)]10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[var(--text-primary)] font-semibold">Create a channel</h3>
                <button
                  onClick={() => setShowNewChannel(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 mb-5">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    placeholder="channel-name"
                    autoFocus
                    className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all"
                  />
                </div>
                <div>
                  <input
                    value={newChannelDesc}
                    onChange={e => setNewChannelDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all"
                  />
                </div>
                <div>
                  <div className="relative">
                    <select
                      value={newChannelType}
                      onChange={e => setNewChannelType(e.target.value)}
                      className="w-full appearance-none bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-[var(--border)]20 transition-all cursor-pointer"
                    >
                      <option value="public" className="bg-slate-900 text-white">Public Channel</option>
                      <option value="private" className="bg-slate-900 text-white">Private Channel</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={createChannel}
                  disabled={!newChannelName.trim()}
                >
                  Create Channel
                </Button>
                <Button variant="ghost" onClick={() => setShowNewChannel(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MessageBubble({
  message,
  isOwn,
  grouped,
}: {
  message: Message & { grouped?: boolean }
  isOwn: boolean
  grouped: boolean
}) {
  if (!message.sender) return null

  return (
    <motion.div
      initial={!grouped ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 group', grouped ? 'mt-0.5' : 'mt-4', isOwn && 'flex-row-reverse')}
    >
      {!grouped ? (
        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
          {message.sender.avatar_url ? (
            <AvatarImage src={message.sender.avatar_url} alt={message.sender.full_name} />
          ) : (
            <AvatarFallback>{getInitials(message.sender.full_name)}</AvatarFallback>
          )}
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className={cn('max-w-[70%]', isOwn && 'items-end flex flex-col')}>
        {!grouped && (
          <div className={cn('flex items-baseline gap-2 mb-1', isOwn && 'flex-row-reverse')}>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {isOwn ? 'You' : message.sender.full_name}
            </span>
            <span className="text-xs text-slate-600">{timeAgo(message.created_at)}</span>
          </div>
        )}
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
            isOwn
              ? 'rounded-tr-sm text-white'  // own bubble: white text, background via style
              : 'bg-white/[0.06] text-slate-200 rounded-tl-sm',
            grouped && isOwn && 'rounded-tr-2xl',
            grouped && !isOwn && 'rounded-tl-2xl'
          )}
          style={isOwn ? { background: 'var(--primary)' } : undefined}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  )
}