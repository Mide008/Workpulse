// apps/web/src/components/marketing/hero.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock, ListChecks, Sparkles } from 'lucide-react'
import FloatingOrbs from '@/components/motion/floating-orbs'
import WordReveal from '@/components/motion/word-reveal'
import AnimatedCounter from '@/components/motion/animated-counter'
import TiltCard from '@/components/motion/tilt-card'
import MagneticButton from '@/components/motion/magnetic-button'
import { ease } from '@/lib/motion'

const TASKS = ['Site inspection report', 'Q4 supplier contracts', 'Onboard new hires', 'Follow up 12 warm leads']

function ProductPreview() {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setTick(t => t + 1), 2600)
    return () => clearInterval(id)
  }, [reduced])
  const done = tick % (TASKS.length + 1)
  const approved = tick % 2 === 1
  const kpi = 72 + Math.min(done, 4) * 4

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="absolute -inset-4 rounded-[2rem] blur-3xl opacity-60" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(99,102,241,.45), transparent)' }} aria-hidden="true" />
      <TiltCard intensity={4} glare className="relative">
        <div className="rounded-2xl overflow-hidden bg-[#080d22]/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,.6)] backdrop-blur-xl">
          <div className="flex items-center gap-2 px-4 h-10 border-b border-white/5 bg-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-[11px] font-medium text-slate-400">workpulse / dashboard · sample data</span>
          </div>
          <div className="grid md:grid-cols-5 gap-4 p-4 sm:p-5 text-left">
            <div className="md:col-span-2 rounded-xl p-4 bg-gradient-to-br from-indigo-500/20 to-slate-900/50 border border-indigo-500/30">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">Your KPI</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-black text-white tabular-nums leading-none"><AnimatedCounter value={kpi} /></span>
                <span className="mb-1 text-sm font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">{kpi >= 85 ? 'A' : 'B'}</span>
              </div>
              <div className="h-1.5 rounded-full mt-4 overflow-hidden bg-white/10">
                <motion.div className="h-full rounded-full origin-left bg-gradient-to-r from-indigo-400 to-emerald-400"
                  animate={{ scaleX: kpi / 100 }} transition={{ duration: 0.9, ease: ease.expo }} />
              </div>
              <p className="text-xs mt-2 text-slate-300">{done} of {TASKS.length} tasks done today</p>
            </div>

            <div className="md:col-span-3 rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300 mb-3"><ListChecks className="w-3.5 h-3.5" />Today</p>
              <ul className="space-y-2">
                {TASKS.map((t, i) => {
                  const isDone = i < done
                  return (
                    <li key={t} className="flex items-center gap-3 text-sm">
                      <motion.span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                        animate={{ background: isDone ? '#10B981' : 'transparent', borderColor: isDone ? '#10B981' : 'rgba(255,255,255,.3)', scale: isDone ? [1, 1.25, 1] : 1 }}>
                        {isDone && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </motion.span>
                      <span className={isDone ? 'text-slate-500 line-through' : 'text-white font-medium'}>{t}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="md:col-span-3 rounded-xl p-4 flex items-center gap-3 bg-white/5 border border-white/10">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/20"><ClipboardCheck className="w-5 h-5 text-amber-300" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Equipment purchase · 4,200</p>
                <p className="text-xs text-slate-400">Requested by Site Manager</p>
              </div>
              <AnimatePresence mode="wait">
                <motion.span key={String(approved)} initial={{ opacity: 0, scale: 0.8, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={approved ? { background: 'rgba(16,185,129,.18)', color: '#6EE7B7' } : { background: 'rgba(245,158,11,.18)', color: '#FCD34D' }}>
                  {approved ? <><CheckCircle2 className="w-3.5 h-3.5" />Approved</> : <><Clock className="w-3.5 h-3.5" />Pending</>}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="md:col-span-2 rounded-xl p-4 bg-white/5 border border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 mb-2">Work log</p>
              <p className="text-sm text-white font-medium">14 of 16 submitted</p>
              <p className="text-xs text-emerald-400 mt-1">+9 leads · 3 converted</p>
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  )
}

export default function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 70])
  const fade = useTransform(scrollY, [0, 500], [1, 0.3])

  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40 pb-20 sm:pb-28 aurora">
      <FloatingOrbs />
      <div className="absolute inset-0 grid-lines pointer-events-none" aria-hidden="true" />
      <motion.div style={{ y, opacity: fade }} className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: ease.expo }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
          <Sparkles className="w-4 h-4" /> Free for your first 5 members
        </motion.div>

        <h1 className="font-black tracking-tight text-white leading-[0.98] mb-6" style={{ fontSize: 'clamp(2.6rem, 8.5vw, 5.75rem)' }}>
          <WordReveal text="The operating system" delay={0.1} />
          <br className="hidden sm:block" />
          <WordReveal text="for teams that" delay={0.28} />{' '}
          <span className="gradient-text"><WordReveal text="deliver." delay={0.46} /></span>
        </h1>

        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease: ease.expo }}
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-slate-300">
          Assign work, log the day, approve requests and watch every KPI update live. WorkPulse replaces the spreadsheets, chat threads and approval chasing that slow your people down.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <MagneticButton>
            <Link href="/signup" className="btn-shine inline-flex items-center gap-2 px-8 h-14 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_14px_40px_rgba(99,102,241,.5)]">
              Start free <ArrowRight className="w-5 h-5" />
            </Link>
          </MagneticButton>
          <Link href="/#features" className="inline-flex items-center gap-2 px-8 h-14 rounded-2xl text-base font-bold text-white hover:bg-white/10 border border-white/20 transition-colors">
            See how it works
          </Link>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-sm mb-14 text-slate-400">
          No credit card · Set up in 3 minutes · Any sector, anywhere
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.9, ease: ease.expo }}>
          <ProductPreview />
        </motion.div>

        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16">
          {[[5, '', 'members free'], [3, ' min', 'to set up'], [7, '', 'modules in one app']].map(([v, s, l]) => (
            <div key={l as string}>
              <p className="text-3xl sm:text-4xl font-black text-white tabular-nums"><AnimatedCounter value={v as number} suffix={s as string} /></p>
              <p className="text-xs sm:text-sm mt-1 font-medium text-slate-300">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}