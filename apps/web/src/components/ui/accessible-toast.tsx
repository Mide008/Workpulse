// apps/web/src/components/ui/accessible-toast.tsx
'use client'
import{Toaster}from 'sonner'
export default function AccessibleToaster(){
  return(
    <div role="status" aria-live="polite" aria-atomic="false">
      <Toaster position="bottom-right" toastOptions={{style:{background:'var(--bg-surface)',border:'1px solid var(--border)',color:'var(--text-primary)'},className:'font-medium text-sm'}} richColors closeButton/>
    </div>
  )
}
