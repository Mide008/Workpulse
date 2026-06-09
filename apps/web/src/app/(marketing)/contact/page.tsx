import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — WorkPulse',
  description: 'Get in touch with the WorkPulse team.',
}

const CONTACTS = [
  { label: 'General enquiries', email: 'hello@workpulse.io', desc: 'Questions about WorkPulse or how it works' },
  { label: 'Sales & enterprise', email: 'sales@workpulse.io', desc: 'Pricing, custom plans, white-label' },
  { label: 'Support', email: 'support@workpulse.io', desc: 'Help with your existing account' },
  { label: 'Partnerships', email: 'partners@workpulse.io', desc: 'Integration and referral programmes' },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">Contact us</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
            We respond to every message. Usually within one business day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {CONTACTS.map(c => (
            <div key={c.label}
              className="p-6 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06]
                hover:border-indigo-500/30 transition-all group">
              <h3 className="text-[var(--text-primary)] font-semibold mb-1">{c.label}</h3>
              <p className="text-[var(--text-muted)] text-sm mb-3">{c.desc}</p>
              <a href={`mailto:${c.email}`}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
                {c.email}
              </a>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-surface)]/60 border border-[var(--border)][0.06] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Based in</h2>
          <p className="text-[var(--text-secondary)]">
            WorkPulse is a fully remote company. Our team is distributed across Lagos, London, and Toronto.
            We serve clients globally and support all time zones.
          </p>
        </div>
      </div>
    </div>
  )
}