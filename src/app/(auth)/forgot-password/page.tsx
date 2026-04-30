'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email }: { email: string }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSentEmail(email)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-14 h-14 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-slate-400 text-sm mb-6">
          We sent a reset link to <span className="text-white font-medium">{sentEmail}</span>.
          It expires in 1 hour.
        </p>
        <Link href="/login"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="text-slate-400 mt-1">Enter your email and we&apos;ll send a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
              text-white placeholder:text-slate-500 focus:outline-none focus:ring-2
              focus:ring-indigo-500 transition"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </>
  )
}