/* apps/web/src/app/(marketing)/layout.tsx */
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-slate-950 text-white">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}