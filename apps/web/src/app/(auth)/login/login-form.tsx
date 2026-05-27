'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { WorkPulseLogo } from '@/components/ui/logo'

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
        toast.error('Please check your email and confirm your account first.')
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Wrong email or password. Please try again.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    if (!data.user) {
      toast.error('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile || !(profile as any).workspace_id) {
      // New user — send to onboarding
      router.push('/onboarding/workspace')
      return
    }

    toast.success('Welcome back!')
    router.push(redirectTo === '/onboarding/workspace' ? '/dashboard' : redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <WorkPulseLogo />
        </div>

        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in to your workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11
                    text-white placeholder:text-slate-600 focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                    hover:text-white transition p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-indigo-400 transition">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup"
              className="text-indigo-400 hover:opacity-80 font-medium transition">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}