// apps/web/src/components/motion/word-reveal.tsx
// Emil: overflow-hidden clip + translateY — viewport=false for above-fold hero
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { ease } from '@/lib/motion'

interface Props {
  text: string; className?: string; delay?: number
  stagger?: number; viewport?: boolean
}
export default function WordReveal({ text, className = '', delay = 0, stagger = 0.06, viewport = false }: Props) {
  const reduced = useReducedMotion()
  const words = text.split(' ')
  return (
    <span className={`inline ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.26em] last:mr-0">
          <motion.span
            className="inline-block" aria-hidden="true"
            initial={reduced ? false : { y: '110%', opacity: 0 }}
            {...(viewport
              ? { whileInView: { y: 0, opacity: 1 }, viewport: { once: true, margin: '-40px' } }
              : { animate: { y: 0, opacity: 1 } }
            )}
            transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : delay + i * stagger, ease: ease.expo }}
          >{w}</motion.span>
        </span>
      ))}
    </span>
  )
}
