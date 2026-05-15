'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !password) { toast.error('Please fill in all fields'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-slate-400 mb-6">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/login"
            className="text-[var(--primary,#6366F1)] hover:opacity-80 transition font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <WorkPulseLogo />
        </div>

        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-6">Start your free WorkPulse workspace</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Sarah Johnson" autoComplete="name"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-[var(--primary,#6366F1)]/50
                  hover:border-white/20 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Work email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-[var(--primary,#6366F1)]/50
                  hover:border-white/20 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" autoComplete="new-password"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11
                    text-white placeholder:text-slate-600 focus:outline-none
                    focus:ring-2 focus:ring-[var(--primary,#6366F1)]/50
                    hover:border-white/20 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                    hover:text-white transition p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--primary,#6366F1)] hover:opacity-90 disabled:opacity-50
                text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login"
              className="text-[var(--primary,#6366F1)] hover:opacity-80 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}