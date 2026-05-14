'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CtaSection() {
  return (
    <section className="py-28">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-12 md:p-16 rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20
            via-violet-600/10 to-transparent border border-indigo-500/20 rounded-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px]
            bg-indigo-600/10 rounded-full blur-[80px]" />

          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              Your team is ready.
              <br />
              <span className="gradient-text">Is your system?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join teams who replaced spreadsheets, WhatsApp chains, and opinion-based
              reviews with WorkPulse.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding/workspace"
                className="group flex items-center gap-2 px-8 py-4 bg-indigo-600
                  hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all
                  shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 text-base">
                Start for free — no card needed
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/pricing"
                className="px-8 py-4 text-slate-300 hover:text-white border border-white/10
                  hover:border-white/20 rounded-2xl transition-all text-base">
                View pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}