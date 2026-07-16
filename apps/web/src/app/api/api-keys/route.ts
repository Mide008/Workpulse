// apps/web/src/app/api/api-keys/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api-key'
import type { NextRequest } from 'next/server'

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)  // ← add as any
    .from('api_keys')
    .select('id, name, key_prefix, scopes, last_used_at, expires_at, created_at')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
  return Response.json({ keys: data ?? [] })
})

export const POST = withAuth(async (req: NextRequest, ctx) => {
  if (ctx.roleLevel > 1) return Response.json({ error: 'Only workspace admins can create API keys' }, { status: 403 })

  const { name, scopes = ['read', 'write'], expiresInDays } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })

  const { key, prefix } = generateApiKey()
  const hash = await hashApiKey(key)
  const supabase = await createServerSupabaseClient()

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null

  const { error } = await (supabase as any)  // ← add as any
    .from('api_keys')
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      name: name.trim(),
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      expires_at: expiresAt,
    })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ key, prefix, name, scopes }, { status: 201 })
})

export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  await (supabase as any)  // ← add as any
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('workspace_id', ctx.workspaceId)
  return Response.json({ success: true })
})