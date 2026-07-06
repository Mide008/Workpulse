// apps/web/src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // These routes are always public — no auth required
  const alwaysPublic = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/invite',
    '/pricing',
    '/sectors',
    '/about',
    '/careers',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/cookies',
  ]

  const isAlwaysPublic =
    alwaysPublic.includes(pathname) ||
    pathname.startsWith('/onboarding') ||  // onboarding is client-side auth checked
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')

  // Only protect app routes
  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings')

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Set x-pathname header for settings layout
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}