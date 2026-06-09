import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookie Policy — WorkPulse' }

const COOKIES = [
  { name: 'sb-auth-token', type: 'Essential', purpose: 'Keeps you signed in securely. Required for the product to function.', expiry: 'Session' },
  { name: '__session', type: 'Essential', purpose: 'Manages your authenticated session and workspace context.', expiry: '7 days' },
  { name: '_wp_analytics', type: 'Analytics', purpose: 'Anonymous usage analytics to help us understand how the product is used.', expiry: '90 days' },
  { name: '_wp_preferences', type: 'Functional', purpose: 'Stores UI preferences such as sidebar state and theme.', expiry: '1 year' },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Cookie Policy</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">Last updated: January 2025</p>

        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed mb-12">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What are cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website.
            WorkPulse uses cookies to keep you signed in, remember your preferences,
            and understand how the product is used.</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Types of cookies we use</h2>
            <p>We use three categories: essential cookies (required for the product to work),
            functional cookies (improve your experience), and analytics cookies
            (anonymous usage data). We do not use advertising cookies.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)][0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)][0.06] bg-[var(--bg-surface)]/60">
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-semibold">Purpose</th>
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-semibold">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c, i) => (
                <tr key={c.name}
                  className={i < COOKIES.length - 1 ? 'border-b border-[var(--border)][0.04]' : ''}>
                  <td className="px-4 py-3 text-[var(--text-primary)] font-mono text-xs">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.type}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] max-w-xs">{c.purpose}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 text-[var(--text-secondary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Managing cookies</h2>
          <p>You can control cookies through your browser settings. Disabling essential
          cookies will prevent you from using WorkPulse. For analytics cookies, you can
          opt out at any time by contacting privacy@workpulse.io.</p>
        </div>
      </div>
    </div>
  )
}