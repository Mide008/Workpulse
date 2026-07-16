// apps/web/src/lib/api-key.ts
import { createClient } from '@supabase/supabase-js'

export function generateApiKey(): { key: string; prefix: string } {
  const prefix = 'wp_live'
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const key = `${prefix}_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function validateApiKey(key: string): Promise<{
  valid: boolean
  workspaceId?: string
  userId?: string
  scopes?: string[]
}> {
  if (!key?.startsWith('wp_live_')) return { valid: false }

  const hash = await hashApiKey(key)

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: apiKey } = await adminClient
    .from('api_keys')
    .select('workspace_id, created_by, scopes, expires_at')
    .eq('key_hash', hash)
    .single()

  if (!apiKey) return { valid: false }
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return { valid: false }

  // Update last used
  await adminClient.from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash)

  return {
    valid: true,
    workspaceId: apiKey.workspace_id,
    userId: apiKey.created_by,
    scopes: apiKey.scopes ?? ['read'],
  }
}