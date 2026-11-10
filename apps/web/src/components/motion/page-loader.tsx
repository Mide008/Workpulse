'use client'
import { motion } from 'framer-motion'
import { WorkPulseLogo } from '@/components/ui/logo'

/** Shown while any route is loading, so the screen is never blank. */
export default function PageLoader({ fullscreen = true }: { fullscreen?: boolean }) {
  return (
    <div
      role="status" aria-label="Loading"
      className={`${fullscreen ? 'fixed inset-0 z-[9999]' : 'w-full min-h-[60vh]'} flex items-center justify-center`}
      style={{ background: fullscreen ? 'var(--bg-base)' : 'transparent' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <motion.div className="absolute inset-0 rounded-2xl"
            style={{ background: 'rgba(99,102,241,.45)', filter: 'blur(18px)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
            <WorkPulseLogo size="lg" hideText className="" />
          </motion.div>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }}
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, delay: i * 0.14, repeat: Infinity }} />
          ))}
        </div>
      </div>
    </div>
  )
}
