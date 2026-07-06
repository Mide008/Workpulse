// apps/web/src/app/(auth)/forgot-password/forgot-password-form.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'
import { motion } from 'framer-motion'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { toast.error('Enter your email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
          <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Reset link sent</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">We sent a password reset link to</p>
          <p className="font-semibold text-slate-900 dark:text-white mb-6">{email}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">
            Check your inbox and click the link to set a new password. The link expires in 1 hour.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <WorkPulseLogo />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            No problem. Enter your email and we'll send a reset link straight away.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
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
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}