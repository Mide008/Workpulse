// apps/web/src/app/onboarding/layout.tsx
'use client'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lightbulb } from 'lucide-react'
import { WorkPulseLogo } from '@/components/ui/logo'
import FloatingOrbs from '@/components/motion/floating-orbs'
import { ease } from '@/lib/motion'

const STEPS = [
  { path: 'workspace', label: 'Workspace', hint: 'Name it, pick your sector and brand colour.' },
  { path: 'structure', label: 'Structure', hint: 'Add departments and teams. Optional.' },
  { path: 'invite', label: 'Invite team', hint: 'Bring people in with the right role.' },
  { path: 'complete', label: 'Ready', hint: 'Your workspace is live.' },
]
const TIPS = [
  'Pick the colour your team already associates with your brand. It tints the whole workspace.',
  'Departments drive reporting. You can rename or add more later in Settings.',
  'Managers can approve requests and see the team work log. Staff can log work and raise requests.',
  'Your first 5 members are free. Invite the people you work with every day first.',
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const current = Math.max(0, STEPS.findIndex(s => pathname?.includes(s.path)))

  return (
    <div data-theme="dark" className="min-h-[100dvh] flex bg-[#020617] text-white selection:bg-indigo-500/30">
      <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 flex-col justify-between p-10 relative overflow-hidden border-r border-white/5"
        style={{ background: 'linear-gradient(170deg,#050a1f,#0b1130 60%,#1a1650)' }}>
        <FloatingOrbs />
        <div className="absolute inset-0 grid-lines pointer-events-none" aria-hidden="true" />
        
        <div className="relative z-10">
          <WorkPulseLogo linkTo="/" size="md" />
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-indigo-400">Setup progress</p>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const done = i < current, active = i === current
              return (
                <li key={s.path} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-[15px] top-9 bottom-0 w-0.5 rounded-full overflow-hidden bg-white/10">
                      <motion.span className="block w-full h-full origin-top bg-indigo-500"
                        animate={{ scaleY: done ? 1 : 0 }} transition={{ duration: 0.6, ease: ease.expo }} />
                    </span>
                  )}
                  <motion.span className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
                    animate={{ background: done ? '#6366F1' : active ? 'rgba(99,102,241,.2)' : 'transparent', borderColor: done || active ? '#818CF8' : 'rgba(255,255,255,.15)', scale: active ? 1.08 : 1 }}>
                    {done ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : <span className={active ? 'text-indigo-200' : 'text-slate-500'}>{i + 1}</span>}
                  </motion.span>
                  <div className="pt-0.5">
                    <p className={`text-[15px] font-bold ${active ? 'text-white' : done ? 'text-indigo-300' : 'text-slate-500'}`}>{s.label}</p>
                    <p className="text-sm mt-0.5 text-slate-400">{s.hint}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="relative z-10 rounded-2xl p-5 flex gap-4 bg-white/5 border border-white/10">
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <AnimatePresence mode="wait">
            <motion.p key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm leading-relaxed text-slate-300">
              {TIPS[current]}
            </motion.p>
          </AnimatePresence>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="lg:hidden px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <WorkPulseLogo linkTo="/" size="md" />
            <span className="text-sm font-semibold text-slate-400">Step {current + 1} of {STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
            <motion.div className="h-full rounded-full origin-left bg-gradient-to-r from-indigo-500 to-emerald-400"
              animate={{ scaleX: (current + 1) / STEPS.length }} transition={{ duration: 0.6, ease: ease.expo }} />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 sm:px-12 py-10">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: ease.expo }} className="w-full max-w-xl">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}