import HeroSection from '@/components/marketing/hero'
import FeaturesSection from '@/components/marketing/features'
import SectorsSection from '@/components/marketing/sectors-strip'
import HowItWorksSection from '@/components/marketing/how-it-works'
import TestimonialsSection from '@/components/marketing/testimonials'
import CtaSection from '@/components/marketing/cta'

export const metadata = {
  title: 'WorkPulse — The Team OS for Delivery-Focused Organisations',
  description:
    'Plan, track, collaborate and deliver work — from daily tasks to complex projects. KPI engine, AI summaries, blocker digest. Built for every sector.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SectorsSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  )
}