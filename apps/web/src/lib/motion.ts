// apps/web/src/lib/motion.ts
// Emil Kowalski · Smyde Motion 3D · Impeccable craft floor
// All original exports preserved — fully backward compatible
import type { Variants } from 'framer-motion'

// ── Easing tokens ─────────────────────────────────────────────────────
export const ease = {
  out:       [0.23, 1, 0.32, 1]  as [number,number,number,number],
  inOut:     [0.77, 0, 0.175, 1] as [number,number,number,number],
  expo:      [0.19, 1, 0.22, 1]  as [number,number,number,number],
  drawer:    [0.32, 0.72, 0, 1]  as [number,number,number,number],
  confident: [0.16, 1, 0.3, 1]   as [number,number,number,number],
}

// ── Spring presets ─────────────────────────────────────────────────────
export const spring = {
  snappy:   { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 },
  smooth:   { type: 'spring' as const, stiffness: 260, damping: 28, mass: 1   },
  bouncy:   { type: 'spring' as const, stiffness: 500, damping: 20, mass: 0.6 },
  gentle:   { type: 'spring' as const, stiffness: 160, damping: 26, mass: 1.2 },
  magnetic: { type: 'spring' as const, stiffness: 600, damping: 35, mass: 0.5 },
}

// ── Original exports (kept exactly) ───────────────────────────────────
export const springConfig = { type: 'spring' as const, stiffness: 380, damping: 28 }

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.2 } },
}
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, x: -20 },
}
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
}
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ── New additions ──────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: ease.expo } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.18 } },
}
export const scalePop: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: spring.snappy },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.14 } },
}
export const blurReveal: Variants = {
  initial: { opacity: 0, filter: 'blur(6px)', y: 12 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.55, ease: ease.expo } },
}
export const kpiFlip: Variants = {
  initial: { opacity: 0, rotateY: -90, scale: 0.85 },
  animate: { opacity: 1, rotateY: 0, scale: 1, transition: { ...spring.bouncy, delay: 0.1 } },
}
export const taskComplete = {
  incomplete: { scale: 1, rotate: 0 },
  complete: {
    scale:  [1, 1.4, 0.9, 1.1, 1],
    rotate: [0, -12, 8, -4, 0],
    transition: { duration: 0.5, ease: ease.out },
  },
}
export const bellShake: Variants = {
  idle: { rotate: 0 },
  ring: { rotate: [0,-18,18,-13,13,-8,8,-4,4,0], transition: { duration: 0.8, ease: ease.out } },
}
export const dealDragActive = {
  scale: 1.04, rotate: 2,
  boxShadow: '0 28px 56px rgba(0,0,0,0.28)',
  zIndex: 50, transition: spring.snappy,
}
export const progressScaleX = (pct: number, delay = 0) => ({
  initial: { scaleX: 0 },
  animate: { scaleX: pct / 100, transition: { duration: 0.9, ease: ease.expo, delay } },
})
