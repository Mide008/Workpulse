import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const publicRoutes = [
    '/',
    '/pricing',
    '/sectors',
    '/about',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/invite',
  ]

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') === false && pathname.includes('.')

  if (!user && !isPublicRoute && pathname.startsWith('/dashboard') ||
      !user && !isPublicRoute && pathname.startsWith('/tasks') ||
      !user && !isPublicRoute && pathname.startsWith('/projects') ||
      !user && !isPublicRoute && pathname.startsWith('/analytics') ||
      !user && !isPublicRoute && pathname.startsWith('/team') ||
      !user && !isPublicRoute && pathname.startsWith('/chat') ||
      !user && !isPublicRoute && pathname.startsWith('/goals') ||
      !user && !isPublicRoute && pathname.startsWith('/notifications') ||
      !user && !isPublicRoute && pathname.startsWith('/settings') ||
      !user && !isPublicRoute && pathname.startsWith('/onboarding')) {
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

  return supabaseResponse
}