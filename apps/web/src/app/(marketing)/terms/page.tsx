import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — WorkPulse' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Terms of Service</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">Last updated: January 2025</p>

        <div className="space-y-10 text-[var(--text-secondary)] leading-relaxed">
          {[
            {
              title: '1. Acceptance of terms',
              body: `By accessing or using WorkPulse, you agree to be bound by these Terms of
              Service. If you are using WorkPulse on behalf of an organisation, you represent
              that you have authority to bind that organisation to these terms.`,
            },
            {
              title: '2. Your account',
              body: `You are responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account. You must
              notify us immediately of any unauthorised use. WorkPulse is not liable for
              any loss resulting from unauthorised access to your account.`,
            },
            {
              title: '3. Acceptable use',
              body: `You agree not to use WorkPulse to upload unlawful, harmful, or
              abusive content; to attempt to gain unauthorised access to our systems;
              to reverse-engineer, copy, or resell the product without permission;
              or to violate any applicable laws or regulations.`,
            },
            {
              title: '4. Subscription and billing',
              body: `Paid plans are billed monthly or annually in advance. Prices are
              displayed in USD. You may cancel at any time; your access continues
              until the end of the billing period. We do not offer refunds for
              partial periods except where required by law.`,
            },
            {
              title: '5. Service availability',
              body: `We aim for 99.9% uptime. Scheduled maintenance will be communicated
              in advance. We are not liable for downtime caused by events outside
              our control including internet outages, provider failures, or force majeure.`,
            },
            {
              title: '6. Intellectual property',
              body: `WorkPulse and its underlying software, design, and content are
              the intellectual property of WorkPulse Ltd. Your data remains yours.
              We do not claim ownership of content you upload to the platform.`,
            },
            {
              title: '7. Termination',
              body: `We may suspend or terminate your account if you violate these terms
              or if your account remains inactive for more than 12 months on a free plan.
              You may delete your account at any time from Settings.`,
            },
            {
              title: '8. Governing law',
              body: `These terms are governed by the laws of England and Wales.
              Any disputes will be subject to the exclusive jurisdiction of the courts
              of England and Wales.`,
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}