'use client'

import { motion } from 'framer-motion'
import {
  CheckSquare, BarChart3, MessageSquare, Target,
  AlertTriangle, Zap, Shield, Globe,
} from 'lucide-react'

const FEATURES = [
  {
    icon: CheckSquare,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    title: 'Task Logging & Tracking',
    description: 'Staff log tasks with priority, status, and estimated time. Every update is timestamped and visible to the team instantly.',
  },
  {
    icon: BarChart3,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: 'KPI Engine',
    description: 'Auto-scores each person on completion rate, on-time delivery, priority handling, and activity consistency. Evidence-backed, not opinion-based.',
  },
  {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'Blocker Digest',
    description: 'When tasks are blocked and why feeds into a weekly manager digest. Know exactly what\'s slowing your team before it becomes a problem.',
  },
  {
    icon: Target,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Goal-Setting Module',
    description: 'Managers set monthly and quarterly goals per staff member. Progress is automatically tracked against those goals from logged activity.',
  },
  {
    icon: MessageSquare,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Built-in Chat',
    description: 'Channels, direct messages, and file sharing — all workspace-scoped. Real-time via Supabase. No extra tools needed.',
  },
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    title: 'AI Performance Summaries',
    description: '"Sarah completed 14 tasks, flagged 2 blockers, maintained high-priority focus." Weekly AI-written summaries per staff member.',
  },
  {
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'Role-based Access',
    description: 'Executive, Manager, Team Lead, Staff — each sees exactly what they need. Fully customisable per organisation. Enterprise SSO ready.',
  },
  {
    icon: Globe,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    title: 'White-label Ready',
    description: 'Your logo. Your colours. Your domain. Every company that uses WorkPulse can make it completely their own.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px]
          bg-violet-600/6 rounded-full blur-[100px]" />
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
              bg-white/5 border border-[var(--border)]10 text-[var(--text-secondary)] text-sm font-medium mb-4">
              Everything you need
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
              Built for how teams actually work
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
              Not another tool that collects digital dust. Every feature in WorkPulse was designed
              to solve a real accountability, visibility, or performance problem.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]
                hover:border-indigo-500/30 hover:bg-[var(--bg-surface)]/80 hover:-translate-y-1
                transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                mb-4 ${feature.bg}`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-2 group-hover:text-indigo-300
                transition-colors">
                {feature.title}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}