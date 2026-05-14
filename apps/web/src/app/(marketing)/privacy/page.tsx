import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — WorkPulse' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: January 2025</p>

        <div className="space-y-10 text-slate-400 leading-relaxed">
          {[
            {
              title: '1. Information we collect',
              body: `We collect information you provide directly — such as your name, email address,
              job title, and workspace data — when you create an account or use our services.
              We also collect usage data including log data, device information, and interaction
              events to improve the product. We do not sell your data to third parties.`,
            },
            {
              title: '2. How we use your information',
              body: `Your information is used to provide and improve WorkPulse, communicate with
              you about your account, send product updates you've opted into, and comply with
              legal obligations. We use anonymised, aggregated data for product analytics.`,
            },
            {
              title: '3. Data storage and security',
              body: `All data is stored on Supabase infrastructure hosted on AWS. Data is
              encrypted at rest (AES-256) and in transit (TLS 1.2+). We implement access
              controls, audit logs, and regular security reviews. Your workspace data is
              logically isolated from other customers.`,
            },
            {
              title: '4. Data retention',
              body: `We retain your data for as long as your account is active. When you
              delete your account, we remove your personal data within 30 days, except
              where required by law. Workspace data is retained for 90 days post-deletion
              to enable recovery if requested.`,
            },
            {
              title: '5. Your rights',
              body: `You have the right to access, correct, or delete your personal data at any
              time. You may also request a data export. To exercise these rights, contact
              privacy@workpulse.io. We will respond within 30 days.`,
            },
            {
              title: '6. Cookies',
              body: `We use essential cookies for authentication and session management.
              We use analytics cookies to understand how users interact with the product.
              You can review our full cookie policy at workpulse.io/cookies.`,
            },
            {
              title: '7. Changes to this policy',
              body: `We may update this policy from time to time. We will notify you via
              email or in-app notice at least 14 days before material changes take effect.
              Continued use after that date constitutes acceptance.`,
            },
            {
              title: '8. Contact',
              body: `For privacy-related questions, contact privacy@workpulse.io.`,
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-white mb-3">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}