'use client'

import { motion } from 'framer-motion'
import { ClipboardList, TrendingUp, MessageSquare, Star } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: ClipboardList,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    title: 'Staff log work',
    description: 'Every team member logs their tasks with title, category, priority, and estimated time. Takes 30 seconds.',
  },
  {
    number: '02',
    icon: TrendingUp,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Progress updates in real time',
    description: 'Status changes, progress sliders, blocker flags — all visible to managers the moment they happen.',
  },
  {
    number: '03',
    icon: MessageSquare,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Managers comment and act',
    description: 'Managers see the team dashboard, leave feedback on tasks, flag issues, and rebalance workloads directly.',
  },
  {
    number: '04',
    icon: Star,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'KPIs auto-generate',
    description: 'At the end of every period, KPI scores are calculated from real activity. Performance reviews become evidence-based conversations.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-28 relative">
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
              Simple by design
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              How WorkPulse works
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Four steps. Minimal clicks. Maximum visibility.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px
            bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className={`w-16 h-16 rounded-2xl border ${step.border} ${step.bg}
                flex items-center justify-center mx-auto mb-5 relative`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950
                  border border-white/10 flex items-center justify-center
                  text-[10px] font-bold text-slate-500">
                  {step.number}
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2 text-lg">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}