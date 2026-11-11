// apps/web/src/components/motion/magnetic-button.tsx
'use client'
import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

interface Props {
  children: ReactNode
  className?: string
  href?: string
  intensity?: number
  onClick?: () => void
}

export default function MagneticButton({ children, className = '', href, intensity = 0.3, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 20, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 200, damping: 20, mass: 0.5 })

  function handleMove(e: React.MouseEvent) {
    if (reduced) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * intensity)
    y.set((e.clientY - cy) * intensity)
  }
  function handleLeave() { x.set(0); y.set(0) }

  const inner = href
    ? <Link href={href} className={className}>{children}</Link>
    : <div className={className} onClick={onClick}>{children}</div>

  return (
    <motion.div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ x: sx, y: sy }} className="inline-block">
      {inner}
    </motion.div>
  )
}