'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const SECTORS = [
  { name: 'Real Estate', emoji: '🏢', desc: 'Track listings, viewings, client follow-ups, deal stages' },
  { name: 'Healthcare', emoji: '🏥', desc: 'Clinical admin, patient cases, staff shift tasks' },
  { name: 'Construction', emoji: '🏗️', desc: 'Site activity, subcontractor output, milestones' },
  { name: 'Law & Finance', emoji: '⚖️', desc: 'Matter progress, billing tasks, compliance deadlines' },
  { name: 'Education', emoji: '📚', desc: 'Teacher logs, student projects, admin workflows' },
  { name: 'Logistics', emoji: '🚚', desc: 'Delivery tasks, dispatch, warehouse activity' },
]

export default function SectorsSection() {
  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent
          via-indigo-950/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
              bg-white/5 border border-white/10 text-slate-400 text-sm font-medium mb-4">
              Sector agnostic
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Works for every industry
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Any team with more than 5 people and a delivery problem is a WorkPulse team.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORS.map((sector, i) => (
            <motion.div
              key={sector.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex items-start gap-4 p-5 rounded-2xl
                bg-slate-900/60 border border-white/[0.06]
                hover:border-indigo-500/30 hover:bg-slate-900/80
                transition-all duration-300"
            >
              <span className="text-3xl shrink-0">{sector.emoji}</span>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-300
                  transition-colors">
                  {sector.name}
                </h3>
                <p className="text-slate-500 text-sm">{sector.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/sectors"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300
              text-sm font-medium transition group">
            View all sector use cases
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}