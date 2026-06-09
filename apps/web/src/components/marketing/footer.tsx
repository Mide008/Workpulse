import Link from 'next/link'
import { WorkPulseLogo } from '@/components/ui/logo'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Sectors', href: '/sectors' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/security' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)][0.06] bg-[var(--bg-surface)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <WorkPulseLogo className="mb-4" />
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
              The Team OS that turns chaotic work into structured, trackable, evidence-backed delivery.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-[var(--border)][0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} WorkPulse. All rights reserved.</p>
          <p className="text-sm text-slate-600">Built for teams that take delivery seriously.</p>
        </div>
      </div>
    </footer>
  )
}