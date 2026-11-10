// apps/web/src/components/motion/scroll-reveal.tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { ease } from '@/lib/motion'

type Dir = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
interface Props { children: React.ReactNode; className?: string; delay?: number; direction?: Dir; once?: boolean }

const H: Record<Dir,object> = {
  up:    { opacity:0, y:32 }, down:  { opacity:0, y:-32 },
  left:  { opacity:0, x:48 }, right: { opacity:0, x:-48 },
  scale: { opacity:0, scale:0.88 }, fade: { opacity:0 },
}
const V: Record<Dir,object> = {
  up:    { opacity:1, y:0 },  down:  { opacity:1, y:0 },
  left:  { opacity:1, x:0 },  right: { opacity:1, x:0 },
  scale: { opacity:1, scale:1 }, fade: { opacity:1 },
}

export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up', once = true }: Props) {
  const reduced = useReducedMotion()
  return (
    <motion.div className={className}
      initial={reduced ? false : H[direction]}
      whileInView={{ ...V[direction] }}
      viewport={{ once, margin: '0px 0px -80px 0px' }}
      transition={{ duration: reduced ? 0 : 0.6, ease: ease.expo, delay: reduced ? 0 : delay }}>
      {children}
    </motion.div>
  )
}
