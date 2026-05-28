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
    .is('deleted_at', null)
    .gte('created_at', start.toISOString())

  const { data: targetUser } = await supabase
    .from('users')
    .select('full_name, job_title')
    .eq('id', targetId)
    .single()

  const all = tasks ?? []
  const total = all.length
  const done = all.filter(t => t.status === 'done').length
  const blocked = all.filter(t => t.status === 'blocked').length
  const overdue = all.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length
  const critical = all.filter(t => t.priority === 'critical' || t.priority === 'high').length
  const criticalDone = all.filter(t => (t.priority === 'critical' || t.priority === 'high') && t.status === 'done').length
  const onTimeTasks = all.filter(t => t.status === 'done' && t.completed_at && t.due_date && new Date(t.completed_at) <= new Date(t.due_date))

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
  const onTimeRate = done > 0 ? Math.round((onTimeTasks.length / done) * 100) : 0
  const priorityRate = critical > 0 ? Math.round((criticalDone / critical) * 100) : 100
  const overallScore = Math.round(completionRate * 0.35 + onTimeRate * 0.30 + priorityRate * 0.35)

  const metrics = { completionRate, onTimeRate, priorityRate, overallScore, total, done, blocked, overdue }

  const prompt = `You are the WorkPulse AI Performance Analyst. Write a professional 2-3 sentence performance narrative for ${(targetUser as any)?.full_name ?? 'this team member'}.

Data for the period:
- Total tasks: ${total}
- Completed: ${done} (${completionRate}% completion rate)
- On-time delivery: ${onTimeRate}%
- High/critical priority tasks completed: ${criticalDone}/${critical} (${priorityRate}%)
- Blocked tasks: ${blocked}
- Overdue tasks: ${overdue}
- Overall KPI score: ${overallScore}/100

Write a confident, data-backed performance narrative. Include one specific recommendation. Do not use filler phrases. Be direct.`

  let summary = ''

  // Try Groq first (faster), fall back to Gemini
  try {
    if (process.env.GROQ_API_KEY) {
      const Groq = require('groq-sdk')
      const groq = new Groq.default({ apiKey: process.env.GROQ_API_KEY })
      const completion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a professional performance analyst. Be concise and data-driven.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      })
      summary = completion.choices[0]?.message?.content ?? ''
    }
  } catch (err) {
    console.error('Groq error:', err)
  }

  if (!summary) {
    try {
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenerativeAI } = require('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const result = await model.generateContent(prompt)
        summary = result.response.text()
      }
    } catch (err) {
      console.error('Gemini error:', err)
    }
  }

  if (!summary) {
    summary = overallScore >= 80
      ? `${(targetUser as any)?.full_name ?? 'This team member'} demonstrates strong performance with a ${completionRate}% completion rate and ${onTimeRate}% on-time delivery this period. High-priority task handling is ${priorityRate >= 80 ? 'excellent' : 'adequate'} at ${priorityRate}%. Recommend maintaining current momentum and taking on one stretch goal next period.`
      : `${(targetUser as any)?.full_name ?? 'This team member'} completed ${done} of ${total} tasks at a ${completionRate}% rate with ${overdue} overdue items requiring attention. On-time delivery of ${onTimeRate}% suggests scheduling constraints. Recommend a 1:1 to identify blockers and recalibrate workload distribution.`
  }

  return Response.json({ summary, metrics })
})