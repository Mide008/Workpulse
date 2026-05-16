export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, workspace_id')
          .eq('id', user.id)
          .maybeSingle()

        // No profile → first‑time user → onboarding
        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding/workspace`)
        }

        // Has profile but no workspace yet
        if (!(profile as any).workspace_id) {
          return NextResponse.redirect(`${origin}/onboarding/workspace`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}