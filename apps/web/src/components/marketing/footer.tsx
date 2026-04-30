import Link from 'next/link'
import { WorkPulseLogo } from '@/components/ui/logo'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Sectors', href: '/sectors' },
    { label: 'Changelog', href: '/about' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/about' },
    { label: 'Careers', href: '/about' },
    { label: 'Contact', href: '/about' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/about' },
    { label: 'Terms of Service', href: '/about' },
    { label: 'Security', href: '/about' },
    { label: 'Cookie Policy', href: '/about' },
  ],
}

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <WorkPulseLogo className="mb-4" />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              The Team OS that turns chaotic work into structured, trackable, evidence-backed delivery.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href}
                      className="text-sm text-slate-500 hover:text-white transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row
          items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} WorkPulse. All rights reserved.
          </p>
          <p className="text-sm text-slate-600">
            Built for teams that take delivery seriously.
          </p>
        </div>
      </div>
    </footer>
  )
}