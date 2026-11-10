// apps/web/src/app/(marketing)/security/security-client.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, Lock, Server, Eye, Key, RefreshCw, Zap, CheckCircle2,
} from 'lucide-react'
import FloatingOrbs from '@/components/motion/floating-orbs'
import ScrollReveal from '@/components/motion/scroll-reveal'
import TiltCard from '@/components/motion/tilt-card'
import WordReveal from '@/components/motion/word-reveal'
import { staggerContainer, staggerItem } from '@/lib/motion'

const PILLARS = [
  {
    icon: Lock, title: 'Encryption at rest and in transit', color: '#6366F1',
    points: [
      'AES-256 encryption at rest on all data',
      'TLS 1.3 enforced on all connections',
      'No plaintext credentials stored anywhere',
      'Webhook keys stored as SHA-256 hashes, never raw',
    ],
  },
  {
    icon: Shield, title: 'Row-level security', color: '#10B981',
    points: [
      'Supabase RLS enforces workspace isolation at database level',
      'No cross-workspace data leakage possible by design',
      'Every query scoped to authenticated workspace_id',
      'Admin impersonation logged to full audit trail',
    ],
  },
  {
    icon: Key, title: 'Authentication', color: '#F59E0B',
    points: [
      'Supabase Auth with email and magic link',
      'JWT tokens with short-lived access and rotating refresh',
      'API keys hashed before storage with timing-safe comparison',
      'Invite tokens expire after 7 days',
    ],
  },
  {
    icon: Server, title: 'Infrastructure', color: '#8B5CF6',
    points: [
      'Hosted on Vercel (SOC 2 Type II)',
      'Database on Supabase (SOC 2, ISO 27001)',
      'No third-party access to production database',
      'Automated daily backups with point-in-time recovery',
    ],
  },
  {
    icon: Eye, title: 'Audit and monitoring', color: '#3B82F6',
    points: [
      'Complete audit trail on every mutation',
      'CSV export for compliance review',
      'Rate limiting (60 req/min) on all public API endpoints',
      'Inbound webhook HMAC-SHA256 signature verification',
    ],
  },
  {
    icon: RefreshCw, title: 'Responsible disclosure', color: '#EC4899',
    points: [
      'Security issues: security@workpulse.io',
      'Response within 24 hours',
      'No legal action against good-faith researchers',
      'Public hall of fame for verified reports',
    ],
  },
]

export default function SecurityClient() {
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
          {([['About', '/about'], ['Pricing', '/pricing'], ['Careers', '/careers']] as const).map(([l, h]) => (
            <Link key={l} href={h} className="hover:text-white transition-colors">{l}</Link>
          ))}
          <Link href="/signup" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative py-20 text-center overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(16,185,129,0.12),transparent)]" />
        <div className="relative max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-4">
            <WordReveal text="Security is not" /><br />
            <WordReveal text="a feature." delay={0.1} className="text-emerald-400" />
          </h1>
          <ScrollReveal delay={0.2}>
            <p className="text-xl text-slate-400 leading-relaxed">
              We handle team performance data about real people&apos;s careers.
              Here is exactly what we do to protect it.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="pb-20 max-w-5xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-5"
        >
          {PILLARS.map(p => (
            <motion.div key={p.title} variants={staggerItem}>
              <TiltCard intensity={5} glare className="h-full">
                <div className="h-full p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${p.color}18` }}
                  >
                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <h3 className="font-bold mb-3">{p.title}</h3>
                  <div className="space-y-2">
                    {p.points.map(pt => (
                      <div key={pt} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-400">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="pb-24 text-center max-w-xl mx-auto px-6">
        <ScrollReveal>
          <p className="text-slate-400 mb-4">Found a vulnerability? We want to hear from you.</p>
          <a
            href="mailto:security@workpulse.io"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all"
          >
            <Shield className="w-4 h-4" />
            security@workpulse.io
          </a>
        </ScrollReveal>
      </section>

      <footer className="border-t border-white/[0.04] py-8 text-center">
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} WorkPulse</p>
      </footer>
    </div>
  )
}