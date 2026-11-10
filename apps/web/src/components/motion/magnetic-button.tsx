// apps/web/src/components/motion/magnetic-button.tsx
// Emil Sig 6 — magnetic cursor pull
'use client'
import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface Props { children: React.ReactNode; className?: string; strength?: number; onClick?: () => void }
export default function MagneticButton({ children, className = '', strength = 0.35, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const reduced = useReducedMotion()
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: (e.clientX - r.left - r.width/2) * strength, y: (e.clientY - r.top - r.height/2) * strength })
  }
  return (
    <motion.div ref={ref} className={`inline-flex cursor-pointer ${className}`}
      animate={{ x: pos.x, y: pos.y }} transition={spring.magnetic}
      onMouseMove={onMove} onMouseLeave={() => setPos({ x:0, y:0 })}
      onClick={onClick} whileTap={{ scale: 0.96 }}>
      {children}
    </motion.div>
  )
}
