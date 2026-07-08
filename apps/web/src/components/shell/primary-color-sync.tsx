// apps/web/src/components/shell/primary-color-sync.tsx
'use client'

import { useEffect } from 'react'

export default function PrimaryColorSync({ color }: { color: string }) {
  useEffect(() => {
    if (!color) return
    // Apply to root element so all modals/portals inherit it
    document.documentElement.style.setProperty('--primary', color)
    // Persist for next page loads
    try { localStorage.setItem('wp-primary-color', color) } catch {}
  }, [color])

  return null
}