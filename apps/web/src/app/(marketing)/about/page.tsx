'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-6">
            About WorkPulse
          </h1>
          <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-12">
            WorkPulse was built because we watched too many organisations operate
            without a single place to see what was happening, who was doing what,
            and whether anyone was actually performing.
          </p>

          <div className="space-y-8 mb-16">
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-3">The problem we solve</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Teams across every sector face the same fundamental problem: work is invisible,
                accountability is absent, and performance is measured by opinion rather than evidence.
                Staff use WhatsApp, spreadsheets, and email to report progress. Managers chase
                updates instead of leading. KPIs are set once a year and forgotten until appraisal
                season.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-3">How we're different</h3>
              <div className="space-y-2">
                {[
                  'KPI engine built in — not bolted on',
                  'Sector-agnostic and white-labelable',
                  'Blocker tracking that managers actually use',
                  'AI summaries that replace status meetings',
                  'Designed for non-technical organisations',
                ].map(point => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-slate-300 text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-3">Our mission</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                To give every organisation — regardless of size, sector, or technical maturity —
                the visibility and evidence they need to lead properly, deliver consistently,
                and recognise performance fairly.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600
                hover:bg-indigo-500 text-[var(--text-primary)] font-semibold rounded-2xl transition-all
                shadow-2xl shadow-indigo-500/25 group">
              Start building your Team OS
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}