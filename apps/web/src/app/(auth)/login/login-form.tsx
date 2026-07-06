// apps/web/src/app/(auth)/login/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'
import { motion } from 'framer-motion'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address before signing in.')
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    if (!data.user) { toast.error('Sign in failed. Try again.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile || !(profile as any).workspace_id) {
      router.push('/onboarding/workspace')
      return
    }

    router.push(redirectTo === '/onboarding/workspace' ? '/dashboard' : redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}>
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/15 rounded-full blur-[100px]" />

        <div className="relative">
          <WorkPulseLogo />
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight mb-4">
              Your team's operating system
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Tasks, KPIs, projects, and performance insights — all in one place. Built for organisations that take delivery seriously.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { stat: '4×', label: 'faster performance reviews with auto-generated KPI evidence' },
              { stat: '94%', label: 'of teams report better visibility within the first week' },
              { stat: '0', label: 'spreadsheets needed — everything tracked automatically' },
            ].map(item => (
              <div key={item.stat} className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-300 font-bold text-sm">{item.stat}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed pt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} WorkPulse. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <WorkPulseLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5">
              Sign in to your workspace to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                className="w-full h-11 px-4 rounded-xl border text-sm transition-all
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-800
                  text-slate-900 dark:text-white
                  placeholder:text-slate-400 dark:placeholder:text-slate-600
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
                  hover:border-slate-300 dark:hover:border-slate-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border text-sm transition-all
                    bg-white dark:bg-slate-900
                    border-slate-200 dark:border-slate-800
                    text-slate-900 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-slate-600
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
                    hover:border-slate-300 dark:hover:border-slate-700"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                    text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white
                flex items-center justify-center gap-2 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--primary, #6366F1)' }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}