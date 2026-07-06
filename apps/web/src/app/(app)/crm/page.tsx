// apps/web/src/app/(app)/crm/page.tsx
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

export default function CRMPage() {
  redirect('/crm/pipeline')
}