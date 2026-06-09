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
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Check your inbox</h2>
          <p className="text-[var(--text-secondary)] mb-6">Reset link sent to <strong className="text-[var(--text-primary)]">{email}</strong></p>
          <Link href="/login" className="text-[var(--primary,#6366F1)] hover:opacity-80 transition font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><WorkPulseLogo /></div>
        <div className="bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Reset your password</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">We'll send a reset link to your email</p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3
                  text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-[var(--primary,#6366F1)]/50
                  hover:border-[var(--border)]20 transition-all text-sm"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--primary,#6366F1)] hover:opacity-90 disabled:opacity-50
                text-[var(--text-primary)] font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            <Link href="/login" className="text-[var(--primary,#6366F1)] hover:opacity-80 transition font-medium">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}