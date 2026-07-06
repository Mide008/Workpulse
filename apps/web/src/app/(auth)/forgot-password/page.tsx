// apps/web/src/app/(auth)/forgot-password/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ForgotPasswordForm from './forgot-password-form'

export const metadata = { title: 'Reset password — WorkPulse' }

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}