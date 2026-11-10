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
import FloatingOrbs from '@/components/motion/floating-orbs'
import { ease } from '@/lib/motion'

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

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })

    if (error) {
      if (error.message.includes('Email not confirmed')) toast.error('Please confirm your email address.')
      else if (error.message.includes('Invalid login credentials')) toast.error('Incorrect email or password.')
      else toast.error(error.message)
      setLoading(false)
      return
    }

    if (!data.user) { toast.error('Sign in failed.'); setLoading(false); return }

    const { data: profile } = await supabase.from('users').select('id, workspace_id').eq('id', data.user.id).maybeSingle()
    if (!profile || !(profile as any).workspace_id) { router.push('/onboarding/workspace'); return }

    router.push(redirectTo === '/onboarding/workspace' ? '/dashboard' : redirectTo)
    router.refresh()
  }

  return (
    <div data-theme="dark" className="min-h-[100dvh] flex bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 justify-between"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}>
        <FloatingOrbs />
        <div className="absolute inset-0 grid-lines pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(99,102,241,0.2),transparent)] pointer-events-none" />

        <div className="relative z-10">
          <WorkPulseLogo size="md" linkTo="/" />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: ease.expo }} className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black leading-tight tracking-tight mb-6">
            The operating system for <span className="gradient-text">high-performing teams.</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-10">
            Tasks, KPIs, projects, and performance insights — all in one place. Built for organisations that take delivery seriously.
          </p>

          <div className="space-y-5">
            {[
              { stat: '4×', label: 'faster performance reviews with auto-generated evidence' },
              { stat: '94%', label: 'of teams report better visibility within the first week' },
              { stat: '0', label: 'spreadsheets needed — everything tracked automatically' },
            ].map((item, i) => (
              <motion.div key={item.stat} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg backdrop-blur-sm">
                  <span className="text-indigo-300 font-black text-lg">{item.stat}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} WorkPulse. All rights reserved.
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#020617] lg:bg-transparent lg:border-l lg:border-white/5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: ease.out }} className="w-full max-w-[400px]">
          <div className="lg:hidden mb-10 flex justify-center">
            <WorkPulseLogo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-400">Sign in to your workspace to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : <><span>Sign in</span><ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}