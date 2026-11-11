// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Providers from '@/components/providers'
import PageLoader from '@/components/motion/page-loader'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#6366F1' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'WorkPulse — Team OS for tasks, KPIs, approvals and CRM', template: '%s | WorkPulse' },
  description:
    'WorkPulse is a team operating system for any sector: tasks and projects, daily work logs, in-app approvals, auto-scored KPIs, CRM and performance reviews in one workspace. Free for the first 5 members.',
  applicationName: 'WorkPulse',
  keywords: [
    'team management software', 'work management platform', 'task management', 'KPI tracking software',
    'approval workflow software', 'ERP alternative for small teams', 'employee performance management',
    'daily work log', 'CRM and project management', 'team operating system',
  ],
  category: 'business',
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website', url: SITE_URL, siteName: 'WorkPulse',
    title: 'WorkPulse — The Team OS for delivery-focused organisations',
    description: 'Tasks, work logs, approvals, KPIs and CRM in one workspace. Built for every sector, free for your first 5 members.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorkPulse — The Team OS',
    description: 'Tasks, work logs, approvals, KPIs and CRM in one workspace.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'WorkPulse' },
  icons: { apple: '/icons/icon-192.png', icon: '/icons/icon-192.png' },
  other: { 'ai-content-declaration': 'human-authored product documentation; see /llms.txt' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('wp-theme');
                if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
                var pc = localStorage.getItem('wp-primary-color');
                if (pc) document.documentElement.style.setProperty('--primary', pc);
              } catch (e) {}
            `,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WorkPulse" />
      </head>
      <body
        className={`${outfit.variable} font-sans antialiased min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-200`}
        suppressHydrationWarning
      >
        <Suspense fallback={<PageLoader />}>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Providers>{children}</Providers>
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}