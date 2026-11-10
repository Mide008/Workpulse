// apps/web/src/components/motion/floating-orbs.tsx
// Impeccable atmospheric depth — GPU blur only
'use client'
import { motion, useReducedMotion } from 'framer-motion'

const ORBS = [
  { w:600, h:600, l:'28%', t:'-15%', color:'rgba(99,102,241,0.16)',  dur:18, delay:0 },
  { w:500, h:500, l:'68%', t:'18%',  color:'rgba(139,92,246,0.10)',  dur:22, delay:3 },
  { w:400, h:400, l:'12%', t:'58%',  color:'rgba(59,130,246,0.09)',  dur:26, delay:6 },
  { w:300, h:300, l:'78%', t:'72%',  color:'rgba(16,185,129,0.07)',  dur:20, delay:9 },
]
export default function FloatingOrbs() {
  const reduced = useReducedMotion()
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {ORBS.map((o, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width:o.w, height:o.h, left:o.l, top:o.t, background:o.color, filter:'blur(80px)', transform:'translate(-50%,-50%)' }}
          animate={reduced ? {} : { x:[0,30,-20,15,0], y:[0,-20,15,-10,0] }}
          transition={{ duration:o.dur, delay:o.delay, repeat:Infinity, ease:'easeInOut' }} />
      ))}
    </div>
  )
}
