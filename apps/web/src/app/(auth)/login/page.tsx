export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import LoginForm from './login-form'

export const metadata = { title: 'Sign in — WorkPulse' }

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-surface)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}