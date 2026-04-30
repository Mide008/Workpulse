import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcceptInviteClient from './accept-invite-client'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: invite } = await supabase
    .from('invitations')
    .select('*, workspace:workspaces(name, logo_url, primary_color), role:roles(name)')
    .eq('token', searchParams.token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invitation not found</h1>
          <p className="text-slate-400">This invitation may have expired or already been used.</p>
        </div>
      </div>
    )
  }

  return <AcceptInviteClient invite={invite} />
}