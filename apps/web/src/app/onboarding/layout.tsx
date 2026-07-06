// apps/web/src/app/onboarding/layout.tsx
export const dynamic = 'force-dynamic'

import { WorkPulseLogo } from '@/components/ui/logo'

const STEPS = [
  { id: 1, label: 'Workspace' },
  { id: 2, label: 'Structure' },
  { id: 3, label: 'Invite' },
  { id: 4, label: 'Done' },
]

function getStepFromPath(): number {
  if (typeof window === 'undefined') return 1
  const path = window.location.pathname
  if (path.includes('structure')) return 2
  if (path.includes('invite')) return 3
  if (path.includes('complete')) return 4
  return 1
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left sidebar */}
      <div className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-white/[0.06] p-8 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1117 100%)' }}>
        <WorkPulseLogo />

        <div className="mt-12 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            Setup progress
          </p>
          <div className="space-y-1">
            {STEPS.map((step, i) => (
              <div key={step.id} className="relative">
                <div className="flex items-center gap-3 py-2.5">
                  <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-indigo-400">{step.id}</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-300">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute left-3 top-8 w-px h-4 bg-white/[0.06]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-xs text-slate-500">
            Need help? <a href="mailto:support@workpulse.io" className="text-indigo-400 hover:underline">Contact support</a>
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.06]">
          <WorkPulseLogo />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}