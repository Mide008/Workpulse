'use client'
// Shared split layout for sign in / sign up / reset. Always dark, always readable.
import { motion } from 'framer-motion'
import { CheckCircle2, Layers, ShieldCheck, Zap } from 'lucide-react'
import { WorkPulseLogo } from '@/components/ui/logo'
import FloatingOrbs from '@/components/motion/floating-orbs'
import AnimatedCounter from '@/components/motion/animated-counter'
import WordReveal from '@/components/motion/word-reveal'
import { ease } from '@/lib/motion'

interface Props {
  headline: string
  sub: string
  points: { icon: 'zap' | 'shield' | 'layers' | 'check'; text: string }[]
  children: React.ReactNode
}

const ICONS = { zap: Zap, shield: ShieldCheck, layers: Layers, check: CheckCircle2 }

export default function AuthShell({ headline, sub, points, children }: Props) {
  return (
    <div data-theme="dark" className="min-h-[100dvh] flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Brand panel (desktop) */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[46%] relative overflow-hidden flex-col justify-between p-12 xl:p-16 aurora"
        style={{ background: 'linear-gradient(145deg,#020617 0%,#0b1130 55%,#1a1650 100%)' }}>
        <FloatingOrbs />
        <div className="absolute inset-0 grid-lines pointer-events-none" aria-hidden="true" />
        <WorkPulseLogo linkTo="/" className="relative z-10" />

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.05] text-white mb-5">
            <WordReveal text={headline} delay={0.1} />
          </h2>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: ease.expo }}
            className="text-lg leading-relaxed mb-8" style={{ color: '#CBD5E1' }}>
            {sub}
          </motion.p>

          <ul className="space-y-3.5 mb-10">
            {points.map((p, i) => {
              const Icon = ICONS[p.icon]
              return (
                <motion.li key={p.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.09, duration: 0.5, ease: ease.expo }}
                  className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(129,140,248,.14)', border: '1px solid rgba(129,140,248,.28)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#A5B4FC' }} />
                  </span>
                  <span className="text-[15px] font-medium text-slate-100">{p.text}</span>
                </motion.li>
              )
            })}
          </ul>

          {/* Product glimpse */}
          <motion.div initial={{ opacity: 0, y: 20, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: ease.expo }}
            className="rounded-2xl p-5 backdrop-blur-xl"
            style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 24px 60px rgba(0,0,0,.45)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>Team KPI this week</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#34D399' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <div className="flex items-end gap-6">
              <p className="text-5xl font-black text-white tabular-nums leading-none">
                <AnimatedCounter value={87} />
              </p>
              <div className="flex-1 space-y-2.5">
                {[['Delivery', 92, '#34D399'], ['On time', 84, '#818CF8'], ['Priority work', 79, '#FBBF24']].map(([l, v, c], i) => (
                  <div key={l as string}>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: '#CBD5E1' }}>
                      <span>{l}</span><span>{v}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
                      <motion.div className="h-full rounded-full origin-left" style={{ background: c as string }}
                        initial={{ scaleX: 0 }} animate={{ scaleX: (v as number) / 100 }}
                        transition={{ delay: 1.3 + i * 0.12, duration: 1, ease: ease.expo }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: '#94A3B8' }}>© {new Date().getFullYear()} WorkPulse · Built for teams in every sector</p>
      </aside>

      {/* Form panel */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-10 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden aurora opacity-70" aria-hidden="true" />
        <div className="relative w-full max-w-[26rem]">
          <div className="lg:hidden mb-8 flex justify-center">
            <WorkPulseLogo linkTo="/" />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
