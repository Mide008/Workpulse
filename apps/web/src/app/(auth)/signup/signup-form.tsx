// apps/web/src/app/(auth)/signup/signup-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'
import { motion } from 'framer-motion'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const passwordValid = PASSWORD_RULES.every(r => r.test(password))

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all fields'); return
    }
    if (!passwordValid) { toast.error('Password does not meet requirements'); return }
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <div className="text-3xl">✉️</div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Check your inbox</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            We sent a confirmation link to
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mb-6">{email}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">
            Click the link in the email to activate your account, then return here to sign in.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />

        <div className="relative">
          <WorkPulseLogo />
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight mb-4">
              Start free. Scale when you're ready.
            </h2>
            <p className="text-slate-300 leading-relaxed">
              No credit card required. Set up your workspace in under five minutes. Invite your team and start tracking work that matters.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Auto-generated KPI scores from real work evidence',
              'AI performance narratives for every team member',
              'Role-based access from Executive to Staff',
              'Full CRM, project management, and team chat included',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <p className="text-slate-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-500 text-xs">© {new Date().getFullYear()} WorkPulse. All rights reserved.</p>
      </div>

      {/* Right panel */}
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
              Create your account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5">
              Free forever on the Starter plan. No credit card needed.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Sarah Johnson"
                autoComplete="name"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

              {/* Password requirements */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {PASSWORD_RULES.map(rule => (
                    <div key={rule.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        rule.test(password)
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {rule.test(password) && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </div>
                      <span className={`text-xs transition-colors ${
                        rule.test(password)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white mt-2
                flex items-center justify-center gap-2 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--primary, #6366F1)' }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <><span>Create account</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-700 dark:hover:text-slate-300">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
            Already have an account?{' '}
            <Link href="/login"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}