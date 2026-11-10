// apps/web/src/app/api/hr/appraisals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function GET() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id').eq('id', user.id).single()
  const { data, error } = await (sb as any).from('appraisals')
    .select('*, user:users(id,full_name,avatar_url)')
    .eq('workspace_id', p?.workspace_id ?? '').order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appraisal: data ?? [] })
}

export async function POST(req: NextRequest) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await sb.from('users').select('workspace_id, full_name').eq('id', user.id).single()
  if (!p?.workspace_id) return NextResponse.json({ error: 'No workspace attached' }, { status: 400 })

  const { userId, period, selfAssessment } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data: tasks } = await sb.from('tasks').select('status, priority, due_date, completed_at').eq('workspace_id', p.workspace_id).eq('assigned_to', userId).is('deleted_at', null)
  const { data: goals } = await sb.from('goals').select('status').eq('workspace_id', p.workspace_id).eq('user_id', userId)

  const total = tasks?.length ?? 0
  const done = tasks?.filter(t => t.status === 'done').length ?? 0
  const completionRate = total > 0 ? (done / total) * 100 : 0
  const doneDated = tasks?.filter(t => t.status === 'done' && t.completed_at && t.due_date) ?? []
  const onTimeRate = doneDated.length > 0 ? (doneDated.filter(t => new Date(t.completed_at!) <= new Date(t.due_date!)).length / doneDated.length) * 100 : completionRate
  const kpiScore = Math.round(completionRate * 0.5 + onTimeRate * 0.5)
  const goalsAchieved = goals?.filter(g => g.status === 'completed').length ?? 0

  const { data: member } = await sb.from('users').select('full_name').eq('id', userId).single()
  const name = member?.full_name ?? 'This team member'

  const narrative = `${name} completed ${done} of ${total} tasks (${Math.round(completionRate)}% completion) with a ${Math.round(onTimeRate)}% on-time delivery rate. ${goalsAchieved} goal${goalsAchieved === 1 ? '' : 's'} achieved.` + (selfAssessment ? ` Manager notes: ${selfAssessment}` : '')

  const { data: appraisal, error } = await (sb as any).from('appraisals').insert({
    workspace_id: p.workspace_id, user_id: userId, period: period || 'Current period',
    kpi_score: kpiScore, tasks_completed: done, goals_achieved: goalsAchieved,
    ai_narrative: narrative, self_assessment: selfAssessment || null, status: 'completed',
  }).select('*, user:users(id,full_name,avatar_url)').single()

  if (error) {
    console.error('Appraisal Insert Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    workspaceId: p.workspace_id, userId: user.id, entityType: 'appraisal',
    entityId: appraisal.id, entityTitle: name, action: 'appraisal_generated',
    metadata: { actorName: p.full_name, kpi: kpiScore },
  })

  return NextResponse.json({ appraisal }, { status: 201 })
}