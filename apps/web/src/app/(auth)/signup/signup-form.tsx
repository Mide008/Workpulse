// apps/web/src/app/(auth)/signup/signup-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'
import { motion, AnimatePresence } from 'framer-motion'
import FloatingOrbs from '@/components/motion/floating-orbs'
import { ease } from '@/lib/motion'

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
    if (!fullName.trim() || !email.trim() || !password) { toast.error('Please fill in all fields'); return }
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
      <div data-theme="dark" className="min-h-[100dvh] bg-[#020617] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <div className="text-3xl">✉️</div>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Check your inbox</h2>
          <p className="text-slate-400 mb-2">We sent a confirmation link to</p>
          <p className="font-semibold text-white mb-6">{email}</p>
          <p className="text-sm text-slate-500 mb-8">Click the link in the email to activate your account, then return here to sign in.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Back to sign in</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div data-theme="dark" className="min-h-[100dvh] flex bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* Left panel */}
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
            Start free. <br /><span className="gradient-text">Scale when you're ready.</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-10">
            No credit card required. Set up your workspace in under five minutes.
          </p>

          <div className="space-y-4">
            {[
              'Auto-generated KPI scores from real work evidence',
              'Performance narratives for every team member',
              'Role-based access from Executive to Staff',
              'Full CRM, project management, and team chat included',
            ].map((item, i) => (
              <motion.div key={item} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} WorkPulse. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#020617] lg:bg-transparent lg:border-l lg:border-white/5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: ease.out }} className="w-full max-w-[400px]">
          <div className="lg:hidden mb-10 flex justify-center">
            <WorkPulseLogo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">Create your account</h1>
            <p className="text-slate-400">Free forever on the Starter plan. No credit card needed.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Sarah Johnson"
                autoComplete="name"
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden">
                    {PASSWORD_RULES.map(rule => (
                      <div key={rule.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${rule.test(password) ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                          {rule.test(password) && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                        </div>
                        <span className={`text-xs transition-colors ${rule.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>{rule.label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : <><span>Create account</span><ArrowRight className="w-5 h-5" /></>}
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            By creating an account you agree to our <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-slate-400 mt-4">
            Already have an account? <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}