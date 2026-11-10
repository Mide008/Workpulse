// apps/web/src/app/onboarding/invite/invite-client.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, Mail, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { validateEmailFormat } from '@/lib/email-validation'
import { ease } from '@/lib/motion'

const ROLES = ['Manager', 'Team Lead', 'Staff']
const inputCls = 'w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base'

export default function OnboardingInviteClient() {
  const router = useRouter()
  const [emails, setEmails] = useState([{ email: '', role: 'Staff' }])
  const [sending, setSending] = useState(false)

  function addRow() {
    if (emails.length >= 10) { toast.error('Add up to 10 invitations at once'); return }
    setEmails([...emails, { email: '', role: 'Staff' }])
  }
  const update = (i: number, field: 'email' | 'role', value: string) => setEmails(emails.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)))

  async function handleSend() {
    const valid = emails.filter(inv => inv.email.trim() !== '')
    if (valid.some(inv => !validateEmailFormat(inv.email).valid)) { toast.error('One or more email addresses are invalid. Fix them or remove them.'); return }
    if (valid.length === 0) { router.push('/onboarding/complete'); return }

    setSending(true)
    const results = await Promise.allSettled(
      valid.map(async inv => {
        const res = await fetch('/api/invitations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inv.email.trim().toLowerCase(), role: inv.role }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'Failed')
        return await res.json()
      })
    )
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent
    
    if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} created`)
    if (failed > 0) toast.error(`${failed} could not be sent.`)
    
    setSending(false)
    router.push('/onboarding/complete')
  }

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Invite your team</h1>
      <p className="text-base mb-8 text-slate-400">Invitations go out by email. Choose a role for each person. You can skip this and invite later from Settings.</p>

      <div className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {emails.map((inv, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: ease.out }} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={inv.email} onChange={e => update(i, 'email', e.target.value)} placeholder="colleague@company.com" aria-label={`Email ${i + 1}`} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <select value={inv.role} onChange={e => update(i, 'role', e.target.value)} aria-label="Role" className="h-12 px-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base font-semibold flex-1 sm:flex-none sm:w-36">
                  {ROLES.map(r => <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>)}
                </select>
                {emails.length > 1 && (
                  <button type="button" onClick={() => setEmails(emails.filter((_, idx) => idx !== i))} aria-label="Remove" className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button type="button" onClick={addRow} className="w-full h-12 rounded-xl border-2 border-dashed border-white/20 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:border-indigo-400/60 transition-all flex items-center justify-center gap-2 mb-8">
        <Plus className="w-4 h-4" />Add another person
      </button>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push('/onboarding/complete')} className="h-12 px-6 rounded-xl border border-white/20 text-base font-semibold text-white hover:bg-white/10 transition-colors">Skip</button>
        <motion.button type="button" disabled={sending} onClick={handleSend} whileTap={{ scale: 0.97 }}
          className="btn-shine flex-1 h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_10px_28px_rgba(99,102,241,.4)]">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <>Send invitations <ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </div>
    </div>
  )
}