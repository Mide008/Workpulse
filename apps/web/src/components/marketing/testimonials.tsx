'use client'

import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote: "We used to chase updates in WhatsApp groups every morning. Now our managers open WorkPulse and the entire picture is there. It changed how we start every day.",
    name: "Adaeze Nwosu",
    title: "Head of Operations, Property Firm",
    initials: "AN",
    color: "#6366F1",
  },
  {
    quote: "KPI season used to be the most stressful time of year. Now it's literally just looking at what the system has already calculated. Staff can't dispute it because they logged it themselves.",
    name: "Marcus Olusegun",
    title: "Managing Director, Logistics Company",
    initials: "MO",
    color: "#10B981",
  },
  {
    quote: "The blocker digest feature alone saved us two hours of management meetings per week. We see what's stuck and why, without asking anyone.",
    name: "Sarah Adewale",
    title: "Team Lead, Healthcare Admin",
    initials: "SA",
    color: "#8B5CF6",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Teams that switched never went back
            </h2>
            <p className="text-slate-400 text-lg">
              Real feedback from teams using WorkPulse across industries.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.06]
                flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-slate-300 leading-relaxed flex-1 mb-6 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center
                    text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}