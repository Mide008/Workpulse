// apps/web/src/components/motion/animated-counter.tsx
// Emil Sig 5 — spring-driven number counter
'use client'
import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from 'framer-motion'

interface Props {
  value: number; duration?: number; decimals?: number
  prefix?: string; suffix?: string; className?: string
}
export default function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '', className = '' }: Props) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(reduced ? value : 0)
  const sp = useSpring(mv, { stiffness: 80, damping: 18, mass: 1 })
  const display = useTransform(sp, v => `${prefix}${v.toFixed(decimals)}${suffix}`)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) { mv.set(value) }
    else { mounted.current = true; if (!reduced) setTimeout(() => mv.set(value), 80) }
  }, [value, mv, reduced])
  return <motion.span className={className}>{display}</motion.span>
}
