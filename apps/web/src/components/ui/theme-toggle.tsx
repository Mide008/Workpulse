'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('wp-theme') as 'light' | 'dark' | null
      const t = stored ?? 'light'
      setThemeState(t)
      applyTheme(t)
    } catch {}
  }, [])

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggle() {
    const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light'
    setThemeState(next)
    try { localStorage.setItem('wp-theme', next) } catch {}
    applyTheme(next)
  }

  return (
    <button
      onClick={mounted ? toggle : undefined}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-xl flex items-center justify-center
        transition-all duration-200
        hover:bg-black/5 dark:hover:bg-white/10
        text-slate-500 dark:text-slate-400
        hover:text-slate-900 dark:hover:text-white
        border border-black/[0.06] dark:border-white/[0.08]"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      {/* No AnimatePresence — pure CSS swap */}
      <Sun
        className="w-4 h-4 transition-all duration-200"
        style={{ display: theme === 'dark' ? 'block' : 'none' }}
      />
      <Moon
        className="w-4 h-4 transition-all duration-200"
        style={{ display: theme === 'light' ? 'block' : 'none' }}
      />
    </button>
  )
}