import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
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
        // Check if profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('id, workspace_id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          // No profile — go to onboarding
          return NextResponse.redirect(`${origin}/onboarding/workspace`)
        }

        const workspaceId = (profile as { id: string; workspace_id: string } | null)?.workspace_id
        if (!workspaceId) {
          return NextResponse.redirect(`${origin}/onboarding/workspace`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}