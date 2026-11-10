import HeroSection from '@/components/marketing/hero'
import FeaturesSection from '@/components/marketing/features'
import SectorsSection from '@/components/marketing/sectors-strip'
import HowItWorksSection from '@/components/marketing/how-it-works'
import TestimonialsSection from '@/components/marketing/testimonials'
import FaqSection from '@/components/marketing/faq'
import CtaSection from '@/components/marketing/cta'
import { FAQS, SITE_URL } from '@/lib/marketing-data'

export const metadata = {
  title: 'WorkPulse — Team OS for tasks, work logs, approvals, KPIs and CRM',
  description:
    'One workspace for any team: assign tasks, collect daily work logs, approve requests in-app, track KPIs live and manage leads. Free for your first 5 members.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'WorkPulse', url: SITE_URL, logo: `${SITE_URL}/icons/icon-192.png` },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, url: SITE_URL, name: 'WorkPulse', publisher: { '@id': `${SITE_URL}/#org` } },
      {
        '@type': 'SoftwareApplication', name: 'WorkPulse', url: SITE_URL,
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web, iOS, Android (installable web app)',
        description: 'Team operating system combining tasks and projects, daily work logs, in-app approvals, KPI scoring, CRM and performance reviews.',
        featureList: ['Task and project management', 'Daily work log', 'In-app approvals', 'KPI scoring', 'CRM and lead tracking', 'Performance reviews', 'Role-based access and audit trail'],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free Starter plan for the first 5 members' },
      },
      { '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SectorsSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
