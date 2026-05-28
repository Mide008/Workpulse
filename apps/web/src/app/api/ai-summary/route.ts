import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const { userId, period = 'month' } = body

  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const start = new Date()
  if (period === 'week') start.setDate(now.getDate() - 7)
  else if (period === 'quarter') start.setMonth(now.getMonth() - 3)
  else start.setMonth(now.getMonth() - 1)

  const targetId = userId ?? ctx.userId

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, completed_at, created_at, blocker_reason')
    .eq('assigned_to', targetId)
    .eq('workspace_id', ctx.workspaceId)
    .gte('created_at', start.toISOString())

  const { data: targetUser } = await supabase
    .from('users')
    .select('full_name, job_title')
    .eq('id', targetId)
    .maybeSingle()

  const all = (tasks ?? []) as any[]
  const total = all.length
  const done = all.filter((t: any) => t.status === 'done').length
  const blocked = all.filter((t: any) => t.status === 'blocked').length
  const overdue = all.filter((t: any) =>
    t.due_date && new Date(t.due_date) < now && t.status !== 'done'
  ).length
  const critical = all.filter((t: any) => t.priority === 'critical' || t.priority === 'high').length
  const criticalDone = all.filter((t: any) =>
    (t.priority === 'critical' || t.priority === 'high') && t.status === 'done'
  ).length
  const onTimeTasks = all.filter((t: any) =>
    t.status === 'done' && t.completed_at && t.due_date &&
    new Date(t.completed_at) <= new Date(t.due_date)
  )

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
  const onTimeRate = done > 0 ? Math.round((onTimeTasks.length / done) * 100) : 0
  const priorityRate = critical > 0 ? Math.round((criticalDone / critical) * 100) : 100
  const overallScore = Math.round(completionRate * 0.35 + onTimeRate * 0.30 + priorityRate * 0.35)

  const name = (targetUser as any)?.full_name ?? 'This team member'
  const jobTitle = (targetUser as any)?.job_title ?? 'team member'

  const prompt = `You are a senior performance analytics system. Write a professional 2-3 sentence performance narrative for ${name} (${jobTitle}).

Performance data (${period}):
- Tasks completed: ${done}/${total} — ${completionRate}% completion rate
- On-time delivery: ${onTimeRate}%  
- High/critical priority closed: ${criticalDone}/${critical} — ${priorityRate}%
- Blocked: ${blocked} | Overdue: ${overdue}
- Overall score: ${overallScore}/100

Rules: Be specific and data-backed. Include one concrete recommendation. No filler phrases. Professional tone. Max 3 sentences.`

  let summary = ''

  // Try Groq first (llama-3.1-8b-instant — current active model)
  if (process.env.GROQ_API_KEY && !summary) {
    try {
      const Groq = require('groq-sdk') as any
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a professional performance analyst. Write concise, data-backed summaries.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 250,
        temperature: 0.6,
      })
      summary = completion.choices[0]?.message?.content?.trim() ?? ''
    } catch (err: any) {
      console.error('Groq error:', err?.message ?? err)
    }
  }

  // Fall back to Gemini 2.5 Flash
  if (process.env.GEMINI_API_KEY && !summary) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai') as any
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      summary = result.response.text()?.trim() ?? ''
    } catch (err: any) {
      console.error('Gemini error:', err?.message ?? err)
    }
  }

  // Smart fallback — no API needed
  if (!summary) {
    const trend = overdue > 2 ? 'declining' : blocked > 1 ? 'stalled' : completionRate >= 80 ? 'strong' : 'steady'
    const rec = overdue > 0
      ? `Immediate attention required on ${overdue} overdue item${overdue > 1 ? 's' : ''} to prevent further slippage.`
      : blocked > 0
        ? `Resolve ${blocked} blocked task${blocked > 1 ? 's' : ''} to restore delivery momentum.`
        : `Maintain current delivery rhythm and consider taking on higher-priority work next cycle.`

    summary = `${name} delivered ${done} of ${total} tasks this ${period} with a ${completionRate}% completion rate and ${onTimeRate}% on-time delivery — a ${trend} performance trajectory. High-priority task closure stood at ${priorityRate}%, indicating ${priorityRate >= 80 ? 'effective prioritisation' : 'room for improvement in focus areas'}. ${rec}`
  }

  return Response.json({
    summary,
    metrics: { completionRate, onTimeRate, priorityRate, overallScore, total, done, blocked, overdue },
  })
})