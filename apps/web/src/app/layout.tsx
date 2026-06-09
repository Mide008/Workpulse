// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Providers from '@/components/providers'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#020617',
}

export const metadata: Metadata = {
  title: { default: 'WorkPulse', template: '%s | WorkPulse' },
  description: 'The Team OS — plan, track, collaborate, and deliver work at every scale.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WorkPulse',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('wp-theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `
          }}
        />
      </head>
      <body 
        className={`${outfit.variable} font-sans antialiased min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-200`} 
        suppressHydrationWarning
      >
        <Suspense 
          fallback={
            <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  )
}