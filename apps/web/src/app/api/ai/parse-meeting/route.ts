// apps/web/src/app/api/ai/parse-meeting/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/agents/agent-base'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { notes } = await req.json()
  if (!notes?.trim()) return Response.json({ error: 'Meeting notes required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('workspace_id', ctx.workspaceId)
    .eq('is_active', true)

  const memberList = (members ?? []).map(m => `${m.full_name} (id: ${m.id})`).join(', ')

  const prompt = `Extract action items from these meeting notes. Respond with ONLY valid JSON, no markdown.

Meeting notes:
"""
${notes.slice(0, 3000)}
"""

Team members: ${memberList || 'None'}

Extract all action items. For each one:
{
  "tasks": [
    {
      "title": "action-oriented task title",
      "priority": "critical|high|medium|low",
      "dueDate": "ISO date or null",
      "assigneeId": "matched user id or null",
      "assigneeName": "matched name or null",
      "context": "brief context from meeting (1 sentence max)"
    }
  ],
  "summary": "2-sentence meeting summary"
}

Only include genuine action items (things that need to be done by someone). Ignore discussion points.`

  const raw = await callAI(prompt, 600)
  if (!raw) return Response.json({ error: 'Could not parse notes' }, { status: 500 })

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Response.json({ parsed })
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
})