// apps/web/src/components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
              backdropFilter: 'blur(16px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              borderRadius: '16px',
              fontSize: '14px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            },
            className: 'font-sans',
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}