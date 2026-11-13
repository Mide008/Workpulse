// apps/web/src/proxy.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - icons (PWA icons)
     * - screenshots (PWA screenshots)
     * - Any file with an extension (e.g., .png, .jpg, .svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons|screenshots|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}