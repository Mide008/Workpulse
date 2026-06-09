export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createServerSupabaseClient()

  // Handle invite confirmation (Supabase sends type=invite)
  if (tokenHash && type === 'invite') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check for workspace invite record
        const { data: invite } = await supabase
          .from('invitations')
          .select('id, workspace_id, role, token')
          .eq('email', user.email!)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (invite) {
          return NextResponse.redirect(`${origin}/invite?token=${(invite as any).token}`)
        }
      }
      return NextResponse.redirect(`${origin}/onboarding/workspace`)
    }
  }

  // Handle email confirmation / magic link
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, workspace_id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile || !(profile as any).workspace_id) {
          // Check if there's a pending invite for this email
          const { data: invite } = await supabase
            .from('invitations')
            .select('token')
            .eq('email', user.email!)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (invite) {
            return NextResponse.redirect(`${origin}/invite?token=${(invite as any).token}`)
          }
          return NextResponse.redirect(`${origin}/onboarding/workspace`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}