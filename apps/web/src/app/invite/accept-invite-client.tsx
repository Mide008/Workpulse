'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WorkPulseLogo } from '@/components/ui/logo'
import { toast } from 'sonner'

export default function AcceptInviteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'found' | 'invalid' | 'accepting' | 'done' | 'error'>('loading')
  const [invite, setInvite] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, workspace_id, workspaces(name, primary_color)')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        if (new Date((data as any).expires_at) < new Date()) { setStatus('invalid'); return }
        setInvite(data)
        setEmail((data as any).email)
        setStatus('found')
      })
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!invite) return
    setStatus('accepting')

    // Sign up the user
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    if (signupError && !signupError.message.includes('already registered')) {
      toast.error(signupError.message)
      setStatus('found')
      return
    }

    // If already registered, just sign in
    if (signupError?.message.includes('already registered')) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (loginError) { toast.error('Wrong password for existing account'); setStatus('found'); return }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('error'); return }

    // Get workspace roles
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name, level')
      .eq('workspace_id', (invite as any).workspace_id)

    const matchedRole = (roles ?? []).find((r: any) =>
      r.name.toLowerCase() === (invite as any).role?.toLowerCase()
    )
    const defaultRole = (roles ?? []).find((r: any) => r.level === 4) // Staff

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        workspace_id: (invite as any).workspace_id,
        role_id: matchedRole?.id ?? defaultRole?.id ?? null,
        full_name: fullName.trim() || user.user_metadata?.full_name || email.split('@')[0],
        email: email.trim().toLowerCase(),
        is_active: true,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      setStatus('error')
      return
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', (invite as any).id)

    toast.success('Welcome to the team!')
    setStatus('done')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const workspace = (invite as any)?.workspaces
  const brandColor = workspace?.primary_color ?? '#6366F1'

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">Verifying your invitation...</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Invalid or expired invitation</h2>
          <p className="text-[var(--text-secondary)] mb-6">This invitation link is no longer valid. Please ask your admin to send a new one.</p>
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition">Back to sign in</a>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">You're in!</h2>
          <p className="text-[var(--text-secondary)]">Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><WorkPulseLogo /></div>

        <div className="bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06] rounded-2xl p-8">
          {/* Workspace badge */}
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl"
            style={{ backgroundColor: `${brandColor}15`, border: `1px solid ${brandColor}30` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-primary)] font-bold"
              style={{ backgroundColor: brandColor }}>
              {workspace?.name?.charAt(0)?.toUpperCase() ?? 'W'}
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-semibold">{workspace?.name ?? 'WorkPulse'}</p>
              <p className="text-[var(--text-secondary)] text-sm">You've been invited as <strong className="text-[var(--text-primary)]">{(invite as any)?.role}</strong></p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create your account</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Set up your profile to join the workspace</p>

          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-1.5">Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required
                placeholder="Your full name" autoFocus
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3
                  text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-1.5">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} required type="email"
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3
                  text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-1.5">Create password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} required
                type="password" placeholder="Min. 8 characters" minLength={8}
                className="w-full bg-white/[0.04] border border-[var(--border)]10 rounded-xl px-4 py-3
                  text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
            </div>
            <button type="submit" disabled={status === 'accepting'}
              className="w-full text-[var(--text-primary)] font-semibold py-3 rounded-xl transition
                flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: brandColor }}>
              {status === 'accepting' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'accepting' ? 'Setting up account...' : 'Join workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}