import type { Metadata } from 'next'
import { motion } from 'framer-motion'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Careers — WorkPulse',
  description: 'Join the team building the future of work accountability.',
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
            Build the future of work
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We're a remote-first team on a mission to give every organisation the visibility,
            accountability, and evidence they need to deliver consistently and recognise
            performance fairly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { title: 'Remote first', desc: 'Work from anywhere. We care about output, not office hours.' },
            { title: 'Ownership culture', desc: 'Every team member owns their domain. No micro-management.' },
            { title: 'Meaningful work', desc: 'We solve a real problem for real organisations every day.' },
          ].map(v => (
            <div key={v.title} className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.06]">
              <h3 className="text-white font-semibold mb-2">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-3">No open roles right now</h2>
          <p className="text-slate-400 leading-relaxed max-w-lg mx-auto mb-6">
            We're building carefully and hiring slowly. When we do open roles, they'll appear
            here first. Drop us a note if you'd like to be considered for future opportunities.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600
              hover:bg-indigo-500 text-white font-semibold rounded-xl transition"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  )
}