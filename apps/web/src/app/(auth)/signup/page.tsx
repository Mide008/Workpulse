export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import SignupForm from './signup-form'

export const metadata = { title: 'Create account — WorkPulse' }

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}