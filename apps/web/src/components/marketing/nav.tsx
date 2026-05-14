'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkPulseLogo } from '@/components/ui/logo'

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Sectors', href: '/sectors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/20'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <WorkPulseLogo linkTo="/" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white
                hover:bg-white/5 rounded-xl transition-all">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">
            Sign in
          </Link>
          <Link href="/onboarding/workspace"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600
              hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20
              hover:shadow-indigo-500/30">
            Get started free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.06]"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-slate-300 hover:text-white
                    hover:bg-white/5 rounded-xl transition">
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm text-slate-400 hover:text-white
                    hover:bg-white/5 rounded-xl transition text-center">
                  Sign in
                </Link>
                <Link href="/onboarding/workspace" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-white text-center
                    bg-indigo-600 hover:bg-indigo-500 rounded-xl transition">
                  Get started free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}