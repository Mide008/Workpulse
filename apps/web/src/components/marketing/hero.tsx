'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Play } from 'lucide-react'

const PROOF_POINTS = [
  'No credit card required',
  'Free forever plan',
  'Setup in under 5 minutes',
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]
          bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px]
          bg-violet-600/8 rounded-full blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full
            bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm
            font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Trusted by growing teams in 6+ sectors
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6"
        >
          The Team OS for{' '}
          <span className="gradient-text">
            delivery-focused
          </span>
          {' '}organisations
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Staff log tasks. Managers see the full picture in real time.
          KPIs generate automatically. Every performance review is evidence-backed, not opinion-based.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/onboarding/workspace"
            className="group flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500
              text-white font-semibold rounded-2xl transition-all shadow-2xl
              shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-base">
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/#features"
            className="flex items-center gap-2 px-8 py-4 text-slate-300 hover:text-white
              border border-white/10 hover:border-white/20 rounded-2xl transition-all text-base">
            See how it works
          </Link>
        </motion.div>

        {/* Proof points */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          {PROOF_POINTS.map(point => (
            <span key={point} className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {point}
            </span>
          ))}
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl overflow-hidden
            shadow-2xl shadow-black/50 max-w-5xl mx-auto">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]
              bg-slate-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-slate-800 rounded-lg px-3 py-1 text-xs
                text-slate-500 text-center">
                app.workpulse.io/dashboard
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-6 bg-slate-950">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Tasks', value: '247', color: 'text-indigo-400' },
                  { label: 'In Progress', value: '38', color: 'text-blue-400' },
                  { label: 'Blocked', value: '3', color: 'text-red-400' },
                  { label: 'Done This Week', value: '91', color: 'text-emerald-400' },
                ].map(stat => (
                  <div key={stat.label}
                    className="bg-slate-900/80 border border-white/[0.06] rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-slate-900/80 border border-white/[0.06] rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-3">Task Activity</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 65, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-indigo-500/20 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-sm"
                          style={{ height: `${h}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-white/[0.06] rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-3">KPI Score</p>
                  <div className="flex items-center justify-center h-20">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-indigo-400">87</p>
                      <p className="text-xs text-emerald-400 mt-1">Excellent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}