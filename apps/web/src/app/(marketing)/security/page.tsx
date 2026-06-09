import type { Metadata } from 'next'
import { Shield, Lock, Eye, Server, RefreshCw, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'Security — WorkPulse' }

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: 'Encryption at rest and in transit',
    desc: 'All data is encrypted with AES-256 at rest and TLS 1.3 in transit. No exceptions.',
  },
  {
    icon: Eye,
    title: 'Role-based access control',
    desc: 'Four-tier role hierarchy with granular permissions. Staff only see what they need to.',
  },
  {
    icon: Server,
    title: 'SOC 2-compliant infrastructure',
    desc: 'Hosted on AWS via Supabase with SOC 2 Type II certification and daily backups.',
  },
  {
    icon: RefreshCw,
    title: 'Regular security audits',
    desc: 'We conduct penetration testing and dependency audits on every major release.',
  },
  {
    icon: Shield,
    title: 'Logical data isolation',
    desc: 'Every workspace is logically isolated. Row-level security enforced at the database layer.',
  },
  {
    icon: AlertTriangle,
    title: 'Breach notification',
    desc: 'In the event of a confirmed breach affecting your data, we notify you within 72 hours.',
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">Security</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            WorkPulse is built with security as a foundation, not an afterthought.
            Here's how we protect your organisation's data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {SECURITY_FEATURES.map(f => (
            <div key={f.title}
              className="p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center
                justify-center mb-4">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-2">{f.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Report a vulnerability</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            If you discover a security vulnerability in WorkPulse, please report it
            responsibly. We take all reports seriously and will respond within 24 hours.
          </p>
          <a href="mailto:security@workpulse.io"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            security@workpulse.io
          </a>
        </div>
      </div>
    </div>
  )
}