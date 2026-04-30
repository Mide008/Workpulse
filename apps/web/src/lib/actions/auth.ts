'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, email, avatar_url, job_title, workspace_id,
      role:roles(name, level),
      workspace:workspaces(name, logo_url, primary_color, plan)
    `)
    .eq('id', user.id)
    .maybeSingle()

  // Profile doesn't exist yet — needs onboarding
  if (!profile) return null

  const role = profile.role as { name: string; level: number } | null
  const workspace = profile.workspace as {
    name: string; logo_url: string | null
    primary_color: string; plan: string
  } | null

  return {
    id: profile.id,
    fullName: (profile as any).full_name,
    email: (profile as any).email,
    avatarUrl: (profile as any).avatar_url,
    jobTitle: (profile as any).job_title,
    roleLevel: role?.level ?? 4,
    roleName: role?.name ?? 'Staff',
    workspaceId: (profile as any).workspace_id,
    workspaceName: workspace?.name ?? '',
    workspaceLogo: workspace?.logo_url ?? null,
    primaryColor: workspace?.primary_color ?? '#6366F1',
    plan: workspace?.plan ?? 'free',
  }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}