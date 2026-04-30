'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Invite {
  id: string
  token: string
  email: string
  workspace: { name: string; logo_url: string | null; primary_color: string } | null
  role: { name: string } | null
}

export default function AcceptInviteClient({ invite }: { invite: Invite }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invite.token }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to accept invitation')
        return
      }

      setAccepted(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const workspaceName = invite.workspace?.name ?? 'a workspace'

  if (accepted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re in!</h1>
          <p className="text-slate-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M3 12h4l3-9 4 18 3-9h4" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re invited
        </h1>
        <p className="text-slate-400 mb-1">
          You have been invited to join
        </p>
        <p className="text-white font-semibold text-lg mb-1">{workspaceName}</p>
        {invite.role && (
          <p className="text-slate-500 text-sm mb-8">
            Role: <span className="text-slate-300">{invite.role.name}</span>
          </p>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white font-semibold py-3 rounded-xl transition
            flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Accepting...' : 'Accept invitation'}
        </button>

        <p className="text-slate-600 text-xs mt-4">
          By accepting, you agree to WorkPulse&apos;s Terms of Service.
        </p>
      </div>
    </div>
  )
}