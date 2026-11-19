// apps/web/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Update Supabase session
  const response = await updateSession(request)

  // 2. Security: Prevent Cache Poisoning on Auth/API routes
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/auth/')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  // 3. AI Crawler Detection & Geo Tracking (Fire and forget)
  const userAgent = request.headers.get('user-agent') || ''
  const isAICrawler = /GPTBot|ChatGPT-User|ClaudeBot|PerplexityBot|Google-Extended/i.test(userAgent)
  
  // Vercel automatically injects these headers
  const country = request.headers.get('x-vercel-ip-country') || 'Unknown'
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown'

  // Only log if it's a page view (not an asset) and not a bot
  if (!isAICrawler && !request.nextUrl.pathname.includes('.') && request.method === 'GET') {
    // Send to our tracking API (we don't await this so it doesn't block the user)
    fetch(new URL('/api/analytics/track', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, city, path: request.nextUrl.pathname })
    }).catch(() => {})
  }

  return response
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