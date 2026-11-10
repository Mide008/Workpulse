// apps/web/src/app/onboarding/complete/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, FolderKanban, Users } from 'lucide-react'
import { ease } from '@/lib/motion'

const NEXT = [
  { icon: FolderKanban, label: 'Create your first project', href: '/projects/new', color: '#818CF8' },
  { icon: FileText, label: 'Submit today’s work log', href: '/standup', color: '#34D399' },
  { icon: ClipboardCheck, label: 'Try an approval request', href: '/approvals', color: '#FBBF24' },
  { icon: Users, label: 'Invite more teammates', href: '/team', color: '#F472B6' },
]

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(8)
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => (s <= 1 ? (clearInterval(id), router.push('/dashboard'), 0) : s - 1)), 1000)
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        className="w-24 h-24 rounded-3xl mx-auto mb-7 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_70px_rgba(16,185,129,.45)]">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">You’re all set.</h1>
      <p className="text-lg mb-9 text-slate-400">Your workspace is live. Here is a good way to start.</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-9 text-left">
        {NEXT.map((n, i) => (
          <motion.div key={n.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: ease.expo }}>
            <Link href={n.href} className="flex items-center gap-3 p-4 rounded-2xl min-h-[64px] hover:-translate-y-1 hover:bg-white/10 transition-all bg-white/5 border border-white/10">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${n.color}20` }}><n.icon className="w-5 h-5" style={{ color: n.color }} /></span>
              <span className="text-[15px] font-semibold text-white">{n.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
            </Link>
          </motion.div>
        ))}
      </div>

      <Link href="/dashboard" className="btn-shine inline-flex items-center gap-2 px-8 h-14 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_12px_34px_rgba(99,102,241,.45)] transition-transform hover:scale-105 active:scale-95">
        Go to dashboard <ArrowRight className="w-5 h-5" />
      </Link>
      <p className="text-sm mt-4 text-slate-500">Redirecting automatically in {seconds}s</p>
    </div>
  )
}