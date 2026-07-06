// apps/web/src/app/reset-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const passwordValid = PASSWORD_RULES.every(r => r.test(password))
  const passwordsMatch = password === confirm && confirm.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordValid) { toast.error('Password does not meet requirements'); return }
    if (!passwordsMatch) { toast.error('Passwords do not match'); return }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Password updated successfully')
    router.push('/dashboard')
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

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Set new password</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose something strong and memorable</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoFocus
                className="w-full h-11 px-4 pr-11 rounded-xl border text-sm transition-all
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-800
                  text-slate-900 dark:text-white
                  placeholder:text-slate-400 dark:placeholder:text-slate-600
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                  text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className={`w-full h-11 px-4 rounded-xl border text-sm transition-all
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-600
                focus:outline-none focus:ring-2 focus:border-indigo-500
                ${confirm.length > 0
                  ? passwordsMatch
                    ? 'border-emerald-400 focus:ring-emerald-500/30'
                    : 'border-red-400 focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/40'
                }`}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordValid || !passwordsMatch}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white mt-2
              flex items-center justify-center gap-2 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--primary, #6366F1)' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
            ) : (
              'Update password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}