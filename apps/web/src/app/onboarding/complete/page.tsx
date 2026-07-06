// apps/web/src/app/(onboarding)/complete/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          router.push('/dashboard')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">You're all set</h1>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Your workspace is ready. Start tracking tasks, invite your team, and let WorkPulse do the rest.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
            text-white font-semibold px-8 py-3 rounded-xl transition hover:opacity-90 active:scale-[0.98]"
        >
          Go to dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-slate-600 text-sm mt-4">
          Redirecting in {countdown}s
        </p>
      </motion.div>
    </motion.div>
  )
}