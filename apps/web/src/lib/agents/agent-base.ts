// apps/web/src/lib/agents/agent-base.ts

import { createClient } from '@supabase/supabase-js'

// --- Helpers for agents ---
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createNotification(
  supabase: any,
  {
    workspaceId,
    userId,
    title,
    message,
    type = 'info',
    link,
    source = 'agent',
    actionUrl,
  }: {
    workspaceId: string
    userId: string
    title: string
    message?: string
    type?: string
    link?: string
    source?: string
    actionUrl?: string
  }
) {
  await supabase.from('notifications').insert({
    workspace_id: workspaceId,
    user_id: userId,
    title,
    message: message ?? null,
    type,
    link: link ?? '/notifications',
    read: false,
    source,
    action_url: actionUrl ?? null,
  })
}

export async function logAgentRun(
  supabase: any,
  workspaceId: string,
  agentType: string,
  status: string,
  result?: any,
  error?: string
) {
  await supabase.from('agent_runs').insert({
    workspace_id: workspaceId,
    agent_type: agentType,
    status,
    result: result ?? null,
    error: error ?? null,
  })
}

// --- AI call function (already present) ---
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function callAI(prompt: string, maxTokens = 600, retries = 2): Promise<string | null> {
  const providers = []

  if (GROQ_API_KEY) {
    providers.push(() => callGroq(prompt, maxTokens))
  }
  if (GEMINI_API_KEY) {
    providers.push(() => callGemini(prompt, maxTokens))
  }

  if (providers.length === 0) {
    console.warn('[callAI] No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.')
    return fallbackParse(prompt)
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const provider of providers) {
      try {
        const result = await provider()
        if (result) return result
      } catch (err) {
        console.error('[callAI] Provider failed:', err)
      }
    }
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return fallbackParse(prompt)
}

async function callGroq(prompt: string, maxTokens: number): Promise<string | null> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a precise AI that extracts structured data from text. Respond with ONLY valid JSON, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('[Groq] API error:', res.status, error)
    return null
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || null
}

async function callGemini(prompt: string, maxTokens: number): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('[Gemini] API error:', res.status, error)
    return null
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null
}

function fallbackParse(prompt: string): string | null {
  const jsonMatch = prompt.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[0])
      return jsonMatch[0]
    } catch {
      // not valid JSON
    }
  }

  const lines = prompt.split('\n')
  const tasks: any[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '')
      if (content.length > 5) {
        tasks.push({
          title: content.slice(0, 100),
          priority: 'medium',
          dueDate: null,
          assigneeId: null,
          assigneeName: null,
          context: content,
        })
      }
    }
  }

  if (tasks.length > 0) {
    return JSON.stringify({
      tasks,
      summary: `Found ${tasks.length} action items from meeting notes.`,
    })
  }

  return null
}