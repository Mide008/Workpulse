import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Careers — WorkPulse' }
export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-6 text-[var(--text-primary)] text-center">
        <h1 className="text-4xl font-bold mb-4">Join our team</h1>
        <p className="text-[var(--text-secondary)] text-lg">We are a remote‑first team building the future of work. Check back soon for open positions.</p>
      </div>
    </div>
  )
}