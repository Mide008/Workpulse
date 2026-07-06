// apps/web/src/app/reports/[token]/shared-report-client.tsx
'use client'

import { WorkPulseLogo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

function grade(score: number) {
  if (score >= 90) return { label: 'Excellent', grade: 'A', color: '#10B981' }
  if (score >= 80) return { label: 'Good', grade: 'B', color: '#3B82F6' }
  if (score >= 65) return { label: 'Fair', grade: 'C', color: '#F59E0B' }
  return { label: 'Needs Work', grade: 'D', color: '#EF4444' }
}

export default function SharedReportClient({ report }: { report: any }) {
  const snapshot = report.snapshot ?? {}
  const members = snapshot.members ?? []
  const kpi = snapshot.kpi ?? {}
  const workspace = snapshot.workspace ?? {}
  const period = report.period ?? 'month'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <WorkPulseLogo />
        <div className="text-right">
          <p className="text-xs text-slate-500">Shared performance report</p>
          <p className="text-sm font-semibold text-slate-300">{workspace.name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{report.title}</h1>
          <p className="text-slate-400 mt-1 capitalize">
            Period: {period} · Generated {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Overall KPI */}
        {kpi.overallScore !== undefined && (
          <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Workspace KPI Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black" style={{ color: grade(kpi.overallScore).color }}>
                {kpi.overallScore}
              </span>
              <div>
                <span className="text-xl font-bold" style={{ color: grade(kpi.overallScore).color }}>
                  Grade {grade(kpi.overallScore).grade}
                </span>
                <p className="text-slate-400 text-sm">{grade(kpi.overallScore).label}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/10">
              {[
                { label: 'Completion', value: kpi.completionRate },
                { label: 'On-time', value: kpi.onTimeRate },
                { label: 'Priority', value: kpi.priorityScore },
                { label: 'Activity', value: kpi.activityScore },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-2xl font-bold text-white">{m.value ?? 0}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team performance */}
        {members.length > 0 && (
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              Team Performance
            </h2>
            <div className="space-y-4">
              {members.map((member: any, i: number) => {
                const g = grade(member.kpi?.overallScore ?? 0)
                return (
                  <div key={member.id ?? i} className="flex items-center gap-4">
                    <span className="text-xs text-slate-600 w-5">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                      {member.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="w-40 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.full_name}</p>
                      <p className="text-xs text-slate-500">{member.taskCount ?? 0} tasks</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">KPI Score</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ color: g.color, background: `${g.color}18` }}>
                            Grade {g.grade}
                          </span>
                          <span className="text-xs font-bold" style={{ color: g.color }}>
                            {member.kpi?.overallScore ?? 0}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-800">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${member.kpi?.overallScore ?? 0}%`, background: g.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Summary if present */}
        {snapshot.aiSummary && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              Performance Narrative
            </h2>
            <p className="text-slate-300 leading-relaxed">{snapshot.aiSummary}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600">
            This report was generated by WorkPulse and shared on {new Date(report.created_at).toLocaleDateString()}. Expires {new Date(report.expires_at).toLocaleDateString()}.
          </p>
          <a href="https://workpulse.io" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
            workpulse.io
          </a>
        </div>
      </div>
    </div>
  )
}