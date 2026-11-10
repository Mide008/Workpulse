'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import ScrollReveal from '@/components/motion/scroll-reveal'
import { FAQS } from '@/lib/marketing-data'

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="py-20 sm:py-28 px-5 sm:px-8 scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#A5B4FC' }}>Questions</p>
          <h2 className="font-black tracking-tight text-white leading-[1.05]" style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>Frequently asked</h2>
        </ScrollReveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${isOpen ? 'rgba(129,140,248,.45)' : 'rgba(255,255,255,.1)'}` }}>
                <h3>
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-5 text-base sm:text-lg font-semibold text-white min-h-[56px]">
                    {f.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(129,140,248,.18)' }}>
                      <Plus className="w-4 h-4" style={{ color: '#C7D2FE' }} />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-6 text-base leading-relaxed" style={{ color: '#CBD5E1' }}>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
