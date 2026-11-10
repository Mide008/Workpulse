// apps/web/src/app/(marketing)/landing-client.tsx
'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Zap, ArrowRight, CheckCircle2, BarChart3, Users, Target,
  Bot, Shield, MessageSquare, TrendingUp, Sparkles, Code2, Globe,
} from 'lucide-react'
import FloatingOrbs from '@/components/motion/floating-orbs'
import WordReveal from '@/components/motion/word-reveal'
import ScrollReveal from '@/components/motion/scroll-reveal'
import TiltCard from '@/components/motion/tilt-card'
import AnimatedCounter from '@/components/motion/animated-counter'
import NoiseTexture from '@/components/motion/noise-texture'
import MagneticButton from '@/components/motion/magnetic-button'
import GlassCard from '@/components/motion/glass-card'
import {
  staggerContainer, staggerItem, ease, blurReveal,
} from '@/lib/motion'

/*
  ⚠️ PLACEHOLDER STATS — replace with real numbers or remove before launch.
  The original brief explicitly says: do not invent fake social proof.
*/
const STATS = [
  { value: 2400, suffix: '+', label: 'Teams active' },
  { value: 98,   suffix: '%', label: 'Uptime SLA' },
  { value: 4.9,  suffix: '★', label: 'User rating', decimals: 1 },
]

const FEATURES = [
  { icon: BarChart3,      color: '#6366F1', title: 'KPI scoring engine',         desc: 'Tasks auto-convert to KPI scores. No spreadsheets, no manual tallying. The score is always current.' },
  { icon: Sparkles,       color: '#8B5CF6', title: 'AI performance narratives',  desc: 'Click one button. Get a full performance summary written for any team member, ready to use in appraisals.' },
  { icon: TrendingUp,     color: '#10B981', title: 'Built-in CRM',               desc: 'Pipeline, contacts, and companies in the same workspace as your tasks. No integration required.' },
  { icon: Bot,            color: '#F59E0B', title: 'Intelligent agents',         desc: 'Set rules once. Agents surface blockers, send pulse reports, and escalate at-risk deals automatically.' },
  { icon: Target,         color: '#EC4899', title: 'Goal tracking',              desc: 'OKRs and goals linked directly to tasks. Progress updates automatically as work gets done.' },
  { icon: MessageSquare,  color: '#3B82F6', title: 'Team chat',                  desc: 'Real-time channels built into the same workspace. No more switching to Slack for context.' },
]

const TRUST = [
  { icon: Shield,  label: 'SOC 2 compliant infrastructure' },
  { icon: Code2,   label: 'MCP server and REST API included' },
  { icon: Globe,   label: 'NGN pricing via Paystack' },
]

const SECTORS = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Consulting']

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const y       = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#fff' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto sticky top-0 z-40 border-b border-white/[0.04]"
        style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
            className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <Zap className="w-4 h-4 text-white" />
          </motion.div>
          <span className="font-bold text-white text-lg">WorkPulse</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          {([
            ['About',    '/about'],
            ['Pricing',  '/pricing'],
            ['Security', '/security'],
            ['Sectors',  '/sectors'],
            ['Careers',  '/careers'],
          ] as const).map(([l, h]) => (
            <Link key={l} href={h} className="hover:text-white transition-colors">{l}</Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Sign in</Link>
          <MagneticButton
            href="/signup"
            intensity={0.2}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25"
          >
            Get started free <ArrowRight className="w-3.5 h-3.5" />
          </MagneticButton>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
        <FloatingOrbs />
        <NoiseTexture opacity={0.025} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />

        <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <motion.div
            variants={blurReveal}
            initial="initial"
            animate="animate"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] text-indigo-400 text-xs font-semibold mb-8"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Now available for teams across Africa
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6">
            <WordReveal text="The team OS" delay={0} /><br />
            <WordReveal text="African businesses" delay={0.1} className="text-slate-300" /><br />
            <WordReveal text="actually need." delay={0.2} className="text-indigo-400" />
          </h1>

          <ScrollReveal delay={0.4}>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Tasks auto-score into KPIs. KPIs become AI narratives. Narratives become appraisals.
              The whole loop runs in one workspace — no spreadsheets, no context switching.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
              <MagneticButton
                href="/signup"
                intensity={0.3}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all text-base"
              >
                Start free — no credit card <ArrowRight className="w-5 h-5" />
              </MagneticButton>
              <Link
                href="/about"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all text-sm"
              >
                See how it works
              </Link>
            </div>
          </ScrollReveal>

          {/* Stats — replace with real numbers or remove */}
          <ScrollReveal delay={0.6}>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="flex items-center justify-center gap-12 flex-wrap"
            >
              {STATS.map(s => (
                <motion.div key={s.label} variants={staggerItem} className="text-center">
                  <p className="text-4xl font-black text-white">
                    <AnimatedCounter value={s.value} duration={1400} decimals={s.decimals ?? 0} suffix={s.suffix} />
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </ScrollReveal>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">
              Everything your team needs.
            </h2>
            <p className="text-xl text-slate-400 max-w-xl mx-auto">
              One workspace. Six systems. Zero duplicated effort.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={staggerItem}>
              <TiltCard intensity={i === 0 ? 8 : 5} glare className="h-full">
                <div
                  className={`h-full p-6 rounded-2xl border border-white/[0.06] relative overflow-hidden ${
                    i === 0
                      ? 'bg-gradient-to-br from-indigo-950/60 to-slate-950'
                      : 'bg-white/[0.02]'
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)]" />
                  )}
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: `${f.color}18`, border: `1px solid ${f.color}25` }}
                    >
                      <f.icon className="w-6 h-6" style={{ color: f.color }} />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* KPI showcase */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <NoiseTexture opacity={0.02} />
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <h2 className="text-4xl font-black mb-5 leading-tight">
                KPI scores that actually mean something.
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                WorkPulse calculates each team member&apos;s performance score from their task completion rate,
                on-time delivery, and priority weighting. The score updates in real time.
                You never have to ask what someone has been working on.
              </p>
              <div className="space-y-3">
                {[
                  'Completion rate (50% weight)',
                  'On-time delivery (30% weight)',
                  'Priority-weighted output (20% weight)',
                ].map((l, i) => (
                  <ScrollReveal key={l} delay={i * 0.08} direction="left">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-300">{l}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all"
                >
                  See your team&apos;s scores <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.1}>
              <GlassCard intensity="high" className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500">
                  Live KPI board
                </p>
                <div className="space-y-4">
                  {[
                    { name: 'Ada O.',   kpi: 94, color: '#10B981', grade: 'A' },
                    { name: 'Tobi E.',  kpi: 81, color: '#3B82F6', grade: 'B' },
                    { name: 'Ngozi A.', kpi: 67, color: '#F59E0B', grade: 'C' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: `${m.color}30`, border: `1px solid ${m.color}50`, color: m.color }}
                      >
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-white">{m.name}</span>
                          <span className="text-xs font-bold" style={{ color: m.color }}>
                            {m.kpi} · {m.grade}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            className="h-full rounded-full origin-left"
                            style={{ background: m.color, scaleX: 0 }}
                            whileInView={{ scaleX: m.kpi / 100 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1], delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-sm text-slate-500 mb-4 uppercase tracking-widest font-semibold">
              Works across every sector
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SECTORS.map(s => (
                <span
                  key={s}
                  className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-slate-400 bg-white/[0.02]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Trust */}
      <section className="py-16 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {TRUST.map(t => (
              <motion.div
                key={t.label}
                variants={staggerItem}
                className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02]"
              >
                <t.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm text-slate-400">{t.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden text-center">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.2),transparent)]" />
        <div className="relative max-w-2xl mx-auto px-6">
          <ScrollReveal direction="scale">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight mb-6">
              <WordReveal text="Start running" /><br />
              <WordReveal text="your team better." delay={0.1} className="text-indigo-400" />
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Free for the first 5 members. No credit card. Set up in under 3 minutes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <MagneticButton
                href="/signup"
                intensity={0.3}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all"
              >
                Get started free <ArrowRight className="w-5 h-5" />
              </MagneticButton>
              <Link
                href="/pricing"
                className="px-6 py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all text-sm"
              >
                See pricing
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">WorkPulse</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                The team OS for modern African businesses. Built in Lagos.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold mb-3 text-slate-300">Product</p>
                <div className="space-y-2 text-slate-500">
                  {([['Pricing', '/pricing'], ['Security', '/security'], ['API', '/docs']] as const).map(([l, h]) => (
                    <Link key={l} href={h} className="block hover:text-slate-300 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-3 text-slate-300">Company</p>
                <div className="space-y-2 text-slate-500">
                  {([['About', '/about'], ['Careers', '/careers'], ['Sectors', '/sectors']] as const).map(([l, h]) => (
                    <Link key={l} href={h} className="block hover:text-slate-300 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-3 text-slate-300">Legal</p>
                <div className="space-y-2 text-slate-500">
                  {([['Privacy', '/privacy'], ['Terms', '/terms']] as const).map(([l, h]) => (
                    <Link key={l} href={h} className="block hover:text-slate-300 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] mt-10 pt-6 text-center">
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} WorkPulse Technologies Ltd · All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}