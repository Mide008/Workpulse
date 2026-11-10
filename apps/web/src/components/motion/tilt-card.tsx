// apps/web/src/components/motion/tilt-card.tsx
// Smyde Motion 3D — GPU perspective tilt
'use client'
import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface Props { children: React.ReactNode; className?: string; intensity?: number; glare?: boolean }
export default function TiltCard({ children, className = '', intensity = 8, glare = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [gp, setGp] = useState({ x: 50, y: 50 })
  const reduced = useReducedMotion()

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width  - 0.5
    const ny = (e.clientY - r.top)  / r.height - 0.5
    setTilt({ x: -ny * intensity, y: nx * intensity })
    setGp({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  return (
    <div ref={ref} className={`${className} preserve-3d`} style={{ perspective: '800px' }}
      onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <motion.div className="relative w-full h-full"
        animate={{ rotateX: tilt.x, rotateY: tilt.y }} transition={spring.smooth}
        style={{ transformStyle: 'preserve-3d' }}>
        {children}
        {glare && !reduced && (
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
            style={{ background: `radial-gradient(circle at ${gp.x}% ${gp.y}%, rgba(255,255,255,0.1), transparent 65%)`, mixBlendMode: 'overlay' }} />
        )}
      </motion.div>
    </div>
  )
}
