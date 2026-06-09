export const dynamic = 'force-dynamic'

import { WorkPulseLogo } from '@/components/ui/logo'

const steps = [
  { id: 1, label: 'Workspace' },
  { id: 2, label: 'Invite' },
  { id: 3, label: 'Done' },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex justify-center mb-10">
          <WorkPulseLogo />
        </div>
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-indigo-500 text-indigo-400">
                  {step.id}
                </div>
                <span className="text-xs text-[var(--text-muted)] hidden sm:block">{step.label}</span>
              </div>
              {i < steps.length - 1 && <div className="w-12 h-px bg-slate-700 mb-5" />}
            </div>
          ))}
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-[var(--border)]10 rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}