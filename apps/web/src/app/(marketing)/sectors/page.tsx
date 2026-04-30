'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const SECTORS = [
  {
    emoji: '🏢',
    name: 'Real Estate',
    headline: 'From listing to closing — every step tracked',
    description: 'Track property listings, viewings, client follow-ups, and deal stages. Managers see the full pipeline without chasing agents.',
    useCases: ['Property listing progress', 'Client follow-up tracking', 'Viewing schedule management', 'Deal stage pipeline', 'Agent KPI scoring'],
    color: '#6366F1',
  },
  {
    emoji: '🏥',
    name: 'Healthcare',
    headline: 'Clinical admin that actually gets done',
    description: 'Monitor clinical admin, patient case progress, and staff shift tasks. Compliance deadlines never get missed.',
    useCases: ['Patient case progress', 'Clinical admin tasks', 'Compliance deadline tracking', 'Staff shift task logging', 'Department performance'],
    color: '#10B981',
  },
  {
    emoji: '🏗️',
    name: 'Construction',
    headline: 'Site activity, subcontractors, milestones',
    description: 'Track site activity, subcontractor output, and project milestone delivery. Blocker digest shows exactly what\'s holding up the schedule.',
    useCases: ['Site activity logging', 'Subcontractor output', 'Milestone tracking', 'Safety task compliance', 'Project phase progress'],
    color: '#F59E0B',
  },
  {
    emoji: '⚖️',
    name: 'Law & Finance',
    headline: 'Matter progress, billing, and compliance',
    description: 'Track matter progress, client billing tasks, and compliance deadlines. Every action timestamped for audit purposes.',
    useCases: ['Matter progress tracking', 'Client billing tasks', 'Compliance deadlines', 'Audit trail', 'Associate performance'],
    color: '#8B5CF6',
  },
  {
    emoji: '📚',
    name: 'Education',
    headline: 'From admin to classroom delivery',
    description: 'Teacher task logs, student project tracking, and admin workflows. Department heads see real workload data, not assumptions.',
    useCases: ['Teacher task logging', 'Student project tracking', 'Admin workflows', 'Department workload', 'Term planning progress'],
    color: '#EC4899',
  },
  {
    emoji: '🚚',
    name: 'Logistics',
    headline: 'Delivery, dispatch, and warehouse',
    description: 'Track delivery tasks, dispatch progress, and warehouse activity. Real-time visibility without radio check-ins.',
    useCases: ['Delivery task tracking', 'Dispatch progress', 'Warehouse activity', 'Driver performance', 'Route completion rates'],
    color: '#06B6D4',
  },
]

export default function SectorsPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
              Built for every sector
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              WorkPulse is sector-agnostic by design. Any organisation with people, tasks,
              and delivery expectations can use it.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((sector, i) => (
            <motion.div
              key={sector.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.06]
                hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{sector.emoji}</span>
                <div>
                  <h3 className="text-white font-bold text-lg">{sector.name}</h3>
                  <p className="text-slate-500 text-sm">{sector.headline}</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{sector.description}</p>
              <ul className="space-y-1.5">
                {sector.useCases.map(uc => (
                  <li key={uc} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: sector.color }} />
                    {uc}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-500 mb-4">Don't see your sector?</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600
              hover:bg-indigo-500 text-white font-semibold rounded-xl transition group">
            Start free — works for any team
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}