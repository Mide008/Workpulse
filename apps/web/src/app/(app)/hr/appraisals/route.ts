// apps/web/src/app/(app)/hr/appraisals/route.ts
export const dynamic = 'force-dynamic'

import { withAuth } from '@/lib/api-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/agents/agent-base'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { userId, period, selfAssessment } = await req.json()
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const [{ data: tasks }, { data: goals }, { data: member }] = await Promise.all([
    supabase.from('tasks')
      .select('id, status, priority, completed_at, due_date')
      .eq('workspace_id', ctx.workspaceId)
      .eq('assigned_to', userId)
      .is('deleted_at', null),
    supabase.from('goals')
      .select('id, title, status, current_value, target_value')
      .eq('workspace_id', ctx.workspaceId)
      .eq('user_id', userId),
    supabase.from('users')
      .select('full_name, job_title')
      .eq('id', userId)
      .single(),
  ])

  const all = tasks ?? []
  const done = all.filter(t => t.status === 'done').length
  const total = all.length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
  const onTime = all.filter(t => t.status === 'done' && t.completed_at && t.due_date && new Date(t.completed_at) <= new Date(t.due_date)).length
  const onTimeRate = done > 0 ? Math.round((onTime / done) * 100) : 0
  const kpiScore = Math.round(completionRate * 0.6 + onTimeRate * 0.4)
  const goalsAchieved = (goals ?? []).filter(g => g.status === 'completed').length

  const prompt = `Write a professional performance appraisal narrative for ${(member as any)?.full_name} (${(member as any)?.job_title ?? 'team member'}).

Period: ${period}
Tasks completed: ${done}/${total} (${completionRate}% completion rate)
On-time delivery: ${onTimeRate}%
KPI Score: ${kpiScore}/100
Goals achieved: ${goalsAchieved}/${(goals ?? []).length}
${selfAssessment ? `Manager notes: ${selfAssessment}` : ''}

Write 3 paragraphs: (1) Overall performance summary with specific metrics, (2) Key strengths demonstrated during the period, (3) Recommended development areas for next period. Be professional, evidence-based, and constructive.`

  const narrative = await callAI(prompt, 400)

  const { data: appraisal, error } = await (supabase as any)
    .from('appraisals')
    .insert({
      workspace_id: ctx.workspaceId,
      user_id: userId,
      reviewer_id: ctx.userId,
      period,
      status: 'draft',
      kpi_score: kpiScore,
      tasks_completed: done,
      goals_achieved: goalsAchieved,
      manager_assessment: selfAssessment ?? null,
      ai_narrative: narrative ?? null,
    })
    .select('*, user:users!appraisals_user_id_fkey(id, full_name, avatar_url)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ appraisal }, { status: 201 })
})