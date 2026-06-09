'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function OnboardingCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 4000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">You&apos;re all set</h1>
      <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
        Your workspace is ready. Taking you to your dashboard now.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
          text-[var(--text-primary)] font-semibold px-6 py-3 rounded-xl transition"
      >
        Go to dashboard
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}