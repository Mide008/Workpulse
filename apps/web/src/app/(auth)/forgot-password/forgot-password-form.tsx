'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error('Enter your email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-slate-400 mb-6">Reset link sent to <strong className="text-white">{email}</strong></p>
          <Link href="/login" className="text-[var(--primary,#6366F1)] hover:opacity-80 transition font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><WorkPulseLogo /></div>
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
          <p className="text-slate-400 text-sm mb-6">We'll send a reset link to your email</p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-[var(--primary,#6366F1)]/50
                  hover:border-white/20 transition-all text-sm"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--primary,#6366F1)] hover:opacity-90 disabled:opacity-50
                text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/login" className="text-[var(--primary,#6366F1)] hover:opacity-80 transition font-medium">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}