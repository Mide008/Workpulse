/* apps/web/src/app/(marketing)/layout.tsx */
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-[var(--bg-base)] text-white overflow-x-clip">
      <MarketingNav />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  )
}
