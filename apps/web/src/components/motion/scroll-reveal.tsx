// apps/web/src/components/motion/scroll-reveal.tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale' | 'none'

const H: Record<Direction, { opacity: number; x?: number; y?: number; scale?: number }> = {
  up:    { opacity: 0, y: 24 },
  down:  { opacity: 0, y: -24 },
  left:  { opacity: 0, x: -24 },
  right: { opacity: 0, x: 24 },
  scale: { opacity: 0, scale: 0.95 },
  none:  { opacity: 1 },
}

interface Props {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  viewport?: { once?: boolean; margin?: string }
}

export default function ScrollReveal({ children, direction = 'up', delay = 0, className, viewport }: Props) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : (H[direction] as any)}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={viewport ?? { once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}