// apps/web/src/components/marketing/features.tsx
'use client'
import { motion } from 'framer-motion'
import { BarChart3, ClipboardCheck, FileText, KanbanSquare, ShieldCheck, TrendingUp, UserCheck } from 'lucide-react'
import ScrollReveal from '@/components/motion/scroll-reveal'
import TiltCard from '@/components/motion/tilt-card'
import { ease } from '@/lib/motion'

function Bars({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex items-end gap-1.5 h-14 mt-5" aria-hidden="true">
      {values.map((v, i) => (
        <motion.div key={i} className="flex-1 rounded-t-md origin-bottom" style={{ background: color, height: `${v}%`, opacity: 0.35 + (i / values.length) * 0.65 }}
          initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.7, ease: ease.expo }} />
      ))}
    </div>
  )
}
function Chips({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-5" aria-hidden="true">
      {items.map((t, i) => (
        <motion.span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
          initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.07 }}>{t}</motion.span>
      ))}
    </div>
  )
}

const CARDS = [
  { span: 'md:col-span-4', icon: KanbanSquare, color: '#818CF8', title: 'Tasks and projects everyone can follow',
    desc: 'Assign work to people or teams, set priorities and due dates, and move tasks across a board. Staff, leads and managers all see the same truth.',
    visual: <Bars values={[40, 62, 48, 80, 66, 92, 74]} color="#818CF8" /> },
  { span: 'md:col-span-2', icon: FileText, color: '#34D399', title: 'Daily work log',
    desc: 'Engineers, site managers and sales staff write what they did today. Managers read one live feed.',
    visual: <Chips items={['Did', 'Next', 'Blockers', '+ leads']} color="#34D399" /> },
  { span: 'md:col-span-2', icon: ClipboardCheck, color: '#FBBF24', title: 'Approvals inside the app',
    desc: 'Leave, expenses, purchases, sign-offs. Managers approve in one tap, and no one chases it on a chat app.',
    visual: <Chips items={['Pending', 'Approved', 'Declined']} color="#FBBF24" /> },
  { span: 'md:col-span-2', icon: BarChart3, color: '#60A5FA', title: 'KPIs that score themselves',
    desc: 'Performance is calculated from recorded work, so reviews run on evidence instead of memory.',
    visual: <Bars values={[55, 70, 64, 86, 78, 94]} color="#60A5FA" /> },
  { span: 'md:col-span-2', icon: TrendingUp, color: '#F472B6', title: 'Live lead visibility',
    desc: 'Leads added and converted show up as the team works, whatever their role. Pipeline included.',
    visual: <Bars values={[90, 70, 52, 34, 22]} color="#F472B6" /> },
  { span: 'md:col-span-3', icon: UserCheck, color: '#A78BFA', title: 'Reviews written from the data',
    desc: 'Generate a clear performance summary per person from their tasks, goals and delivery record, then edit and share it.',
    visual: <Chips items={['Strengths', 'Focus areas', 'Goals met', 'On-time rate']} color="#A78BFA" /> },
  { span: 'md:col-span-3', icon: ShieldCheck, color: '#2DD4BF', title: 'Roles, access and a full audit trail',
    desc: 'Executives, managers, team leads and staff each see what they should. Every important action is recorded and exportable.',
    visual: <Chips items={['Executive', 'Manager', 'Team Lead', 'Staff']} color="#2DD4BF" /> },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 px-5 sm:px-8 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] mb-4 text-indigo-400">One workspace</p>
          <h2 className="font-black tracking-tight text-white leading-[1.05] mb-5" style={{ fontSize: 'clamp(2rem,5.5vw,3.6rem)' }}>
            Everything your team runs on, finally connected.
          </h2>
          <p className="text-lg leading-relaxed text-slate-300">
            Stop stitching together a task tool, a chat group, a spreadsheet and an approval email. WorkPulse brings them together so work, people and decisions live in the same place.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-6 gap-4">
          {CARDS.map((c, i) => (
            <motion.div key={c.title} className={c.span}
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: ease.expo }}>
              <TiltCard intensity={3} glare className="h-full">
                <article className="h-full rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-white/5 border border-white/10">
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: c.color }} aria-hidden="true" />
                  <div className="relative">
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                      <c.icon className="w-6 h-6" style={{ color: c.color }} />
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{c.title}</h3>
                    <p className="text-[15px] leading-relaxed text-slate-300">{c.desc}</p>
                    {c.visual}
                  </div>
                </article>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}