import { Suspense } from 'react'
import LoginForm from './login-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in — WorkPulse' }

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm text-center py-12">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}