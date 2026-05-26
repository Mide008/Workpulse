'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ArrowRight, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingInviteClient() {
  const router = useRouter()
  const [emails, setEmails] = useState([{ email: '', role: 'Staff' }])
  const [sending, setSending] = useState(false)

  function addRow() {
    setEmails([...emails, { email: '', role: 'Staff' }])
  }

  function removeRow(i: number) {
    setEmails(emails.filter((_, idx) => idx !== i))
  }

  function update(i: number, field: string, value: string) {
    const updated = [...emails]
    updated[i] = { ...updated[i], [field]: value }
    setEmails(updated)
  }

  async function handleSend() {
    const valid = emails.filter(inv => inv.email.includes('@'))
    if (valid.length === 0) {
      router.push('/onboarding/complete')
      return
    }
    setSending(true)
    try {
      const results = await Promise.allSettled(
        valid.map(inv =>
          fetch('/api/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inv.email, role: inv.role }),
          })
        )
      )
      const sent = results.filter(r => r.status === 'fulfilled').length
      if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} sent`)
    } catch {
      toast.error('Some invitations failed')
    }
    setSending(false)
    router.push('/onboarding/complete')
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Invite your team</h1>
        <p className="text-slate-400 mt-1">Send invites now or skip and do it from Settings later.</p>
      </div>

      <div className="space-y-3 mb-5">
        {emails.map((inv, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={inv.email}
                onChange={e => update(i, 'email', e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5
                  text-white placeholder:text-slate-500 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>
            <select
              value={inv.role}
              onChange={e => update(i, 'role', e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5
                text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['Executive', 'Manager', 'Team Lead', 'Staff'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {emails.length > 1 && (
              <button onClick={() => removeRow(i)}
                className="p-2 text-slate-500 hover:text-red-400 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addRow}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition mb-8">
        <Plus className="w-4 h-4" />
        Add another
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/onboarding/complete')}
          className="flex-1 border border-white/10 text-slate-400 hover:text-white
            hover:border-white/30 font-medium py-3 rounded-xl transition text-sm"
        >
          Skip for now
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send & continue'}
        </button>
      </div>
    </>
  )
}