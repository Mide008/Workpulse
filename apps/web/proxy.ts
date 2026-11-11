// apps/web/src/proxy.ts
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 requires the exported function to be named 'proxy'
export async function proxy(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api/og).*)'],
}