// apps/web/src/app/onboarding/invite/invite-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ArrowRight, Mail, Users } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// Helper: basic email validation + block common fake domains
function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) return false
  const domain = trimmed.split('@')[1]
  const fakeDomains = ['test.com', 'example.com', 'fake.com', 'mailinator.com', 'tempmail.com', 'guerrillamail.com']
  return !fakeDomains.includes(domain)
}

export default function OnboardingInviteClient() {
  const router = useRouter()
  const [emails, setEmails] = useState([{ email: '', role: 'Staff' }])
  const [sending, setSending] = useState(false)

  function addRow() {
    if (emails.length >= 10) { toast.error('Add up to 10 invitations at once'); return }
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
    const valid = emails.filter(inv => isValidEmail(inv.email))
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
            body: JSON.stringify({ email: inv.email.trim().toLowerCase(), role: inv.role }),
          })
        )
      )
      const sent = results.filter(r => r.status === 'fulfilled').length
      if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} created`)
    } catch {
      toast.error('Some invitations failed. You can retry from Settings.')
    }
    setSending(false)
    router.push('/onboarding/complete')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Invite your team</h1>
        <p className="text-slate-300 mt-1.5">
          Add their emails and roles. They'll receive an invitation link to join your workspace.
        </p>
      </div>

      <div className="space-y-2.5 mb-5">
        {emails.map((inv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={inv.email}
                onChange={e => update(i, 'email', e.target.value)}
                placeholder="colleague@company.com"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4
                  text-white placeholder:text-slate-600 text-sm focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                  hover:border-white/20 transition-all"
              />
            </div>
            <select
              value={inv.role}
              onChange={e => update(i, 'role', e.target.value)}
              className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-300 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            >
              {['Executive', 'Manager', 'Team Lead', 'Staff'].map(r => (
                <option key={r} value={r} className="bg-slate-900">{r}</option>
              ))}
            </select>
            {emails.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-red-400 transition rounded-xl hover:bg-red-500/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition mb-8 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add another person
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/onboarding/complete')}
          className="flex-1 h-11 border border-white/10 text-slate-400 hover:text-white
            hover:border-white/20 font-medium rounded-xl transition text-sm"
        >
          Skip for now
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          {sending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            : <><span>Send & continue</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </motion.div>
  )
}