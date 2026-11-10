// apps/web/src/app/(marketing)/careers/careers-client.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, MapPin, Clock, ArrowRight, Briefcase } from 'lucide-react'
import FloatingOrbs from '@/components/motion/floating-orbs'
import ScrollReveal from '@/components/motion/scroll-reveal'
import TiltCard from '@/components/motion/tilt-card'
import WordReveal from '@/components/motion/word-reveal'
import { staggerContainer, staggerItem } from '@/lib/motion'

const ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering', loc: 'Remote (Africa / EU)', type: 'Full-time',
    desc: 'Own entire features from schema to UI. We use Next.js 16, TypeScript, Supabase, framer-motion. Strong opinions required.',
  },
  {
    title: 'Product Designer',
    team: 'Design', loc: 'Lagos or Remote', type: 'Full-time',
    desc: 'Think in systems, not screens. Figma native. Motion design experience is a strong plus.',
  },
  {
    title: 'Growth Marketing Lead',
    team: 'Growth', loc: 'Remote', type: 'Full-time',
    desc: 'Own top-of-funnel from zero. B2B SaaS experience required. Africa market experience is a distinct advantage.',
  },
  {
    title: 'Customer Success Manager',
    team: 'Customer', loc: 'Lagos, Nigeria', type: 'Full-time',
    desc: 'Make sure every team that signs up actually runs better because of WorkPulse. Data-driven and communicative.',
  },
]

const BENEFITS = [
  'Competitive salary benchmarked to London / Lagos market rates',
  'Equity in an early-stage company with real traction',
  'Remote-first, async-first culture',
  'Annual team retreat (we pick somewhere good)',
  '$1,500/year learning budget — no approval needed',
  'Hardware budget on joining',
]

export default function CareersClient() {
  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#fff' }}>
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">WorkPulse</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {([['About', '/about'], ['Pricing', '/pricing'], ['Security', '/security']] as const).map(([l, h]) => (
            <Link key={l} href={h} className="hover:text-white transition-colors">{l}</Link>
          ))}
          <Link href="/signup" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative py-20 text-center overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />
        <div className="relative max-w-2xl mx-auto px-6">
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-4">
            <WordReveal text="Build what" /><br />
            <WordReveal text="Africa needs." delay={0.1} className="text-indigo-400" />
          </h1>
          <ScrollReveal delay={0.2}>
            <p className="text-xl text-slate-400 leading-relaxed">
              Small, senior team. Hard problems. No process theatre.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="pb-20 max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="text-3xl font-black mb-8">Open roles</h2>
        </ScrollReveal>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {ROLES.map(role => (
            <motion.div key={role.title} variants={staggerItem}>
              <TiltCard intensity={3} glare={false}>
                <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-semibold text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-500/[0.12] border border-indigo-500/20">
                          {role.team}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />{role.loc}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />{role.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-1.5">{role.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{role.desc}</p>
                    </div>
                    <a
                      href={`mailto:careers@workpulse.io?subject=${encodeURIComponent(role.title)}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-600/30 transition-all shrink-0"
                    >
                      Apply <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        <ScrollReveal delay={0.3}>
          <div className="mt-8 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-sm">Don&apos;t see your role?</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Send a note about who you are and what you want to work on.
            </p>
            <a
              href="mailto:careers@workpulse.io"
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              careers@workpulse.io →
            </a>
          </div>
        </ScrollReveal>
      </section>

      <section className="pb-24 max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="text-3xl font-black mb-8">What we offer</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 gap-3">
          {BENEFITS.map(b => (
            <ScrollReveal key={b} direction="left">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#6366F1' }} />
                <p className="text-sm text-slate-300">{b}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-8 text-center">
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} WorkPulse</p>
      </footer>
    </div>
  )
}