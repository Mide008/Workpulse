// apps/web/src/components/marketing/nav.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { WorkPulseLogo } from '@/components/ui/logo'
import { ease } from '@/lib/motion'

const LINKS: [string, string][] = [
  ['Features', '/#features'], ['How it works', '/#how'], ['Sectors', '/#sectors'], ['Pricing', '/pricing'], ['Security', '/security'],
]

export default function MarketingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 12))
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3">
      <motion.nav aria-label="Main"
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: ease.expo }}
        className="mx-auto max-w-6xl h-14 sm:h-16 rounded-2xl px-4 sm:px-6 flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(2,6,23,.78)' : 'rgba(2,6,23,.35)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)'}`,
          backdropFilter: 'blur(18px) saturate(1.5)', WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
          boxShadow: scrolled ? '0 12px 40px rgba(0,0,0,.4)' : 'none',
        }}>
        <WorkPulseLogo linkTo="/" />
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map(([l, h]) => (
            <Link key={l} href={h} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors">{l}</Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors">Sign in</Link>
          <Link href="/signup" className="btn-shine inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_6px_20px_rgba(99,102,241,.4)]">
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <button onClick={() => setOpen(v => !v)} className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10"
          aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: ease.out }}
            className="md:hidden mx-auto max-w-6xl mt-2 rounded-2xl p-3"
            style={{ background: 'rgba(2,6,23,.96)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(20px)' }}>
            {LINKS.map(([l, h], i) => (
              <motion.div key={l} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <Link href={h} onClick={() => setOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold text-white hover:bg-white/10">
                  {l}<ArrowRight className="w-4 h-4 text-slate-300" />
                </Link>
              </motion.div>
            ))}
            <div className="grid grid-cols-2 gap-2 p-1 pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="h-12 rounded-xl flex items-center justify-center font-bold text-white border border-white/20">Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500">Start free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}