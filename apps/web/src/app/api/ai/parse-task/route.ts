// apps/web/src/app/api/ai/parse-task/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/agents/agent-base'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { input } = await req.json()
  if (!input?.trim()) return Response.json({ error: 'Input is required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('workspace_id', ctx.workspaceId)
    .eq('is_active', true)

  const memberList = (members ?? []).map(m => `${m.full_name} (id: ${m.id})`).join(', ')

  const prompt = `Extract task details from this natural language input. Respond with ONLY valid JSON, no markdown.

Input: "${input}"

Team members available: ${memberList || 'None'}

Extract:
{
  "title": "clear task title (required)",
  "description": "additional context if any (or null)",
  "priority": "critical|high|medium|low (default: medium)",
  "dueDate": "ISO date string if mentioned (or null)",
  "assigneeId": "user id from team list if a name is mentioned (or null)",
  "assigneeName": "matched name if found (or null)"
}

Rules:
- If someone says "tomorrow", use ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- If they say "next week", use ${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
- If they say "end of week" or "Friday", use ${(() => { const d = new Date(); const day = d.getDay(); const diff = (5 - day + 7) % 7 || 7; d.setDate(d.getDate() + diff); return d.toISOString().split('T')[0] })()}
- Match assignee names fuzzy (e.g. "Sarah" matches "Sarah Johnson")
- Title should be action-oriented, starting with a verb`

  const raw = await callAI(prompt, 300)
  if (!raw) return Response.json({ error: 'Could not parse input' }, { status: 500 })

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Response.json({ parsed, rawInput: input })
  } catch {
    return Response.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }
})