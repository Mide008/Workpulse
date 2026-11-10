// apps/web/src/components/marketing/footer.tsx
import Link from 'next/link'
import { WorkPulseLogo } from '@/components/ui/logo'

const COLS: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: [['Features', '/#features'], ['How it works', '/#how'], ['Pricing', '/pricing'], ['Security', '/security']] },
  { title: 'Company', links: [['About', '/about'], ['Sectors', '/sectors'], ['Careers', '/careers'], ['Contact', '/contact']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies']] },
]

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 px-5 sm:px-8 pt-16 pb-10">
      <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <WorkPulseLogo linkTo="/" />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-300">
            The team operating system for organisations in every sector: tasks, work logs, approvals, KPIs and CRM in one workspace.
          </p>
        </div>
        {COLS.map(c => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-sm font-bold text-white mb-4">{c.title}</p>
            <ul className="space-y-3">
              {c.links.map(([l, h]) => (
                <li key={l}><Link href={h} className="text-[15px] hover:text-white text-slate-300 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-sm text-slate-400">
        <p>© {new Date().getFullYear()} WorkPulse. All rights reserved.</p>
        <p>Made for teams everywhere.</p>
      </div>
    </footer>
  )
}